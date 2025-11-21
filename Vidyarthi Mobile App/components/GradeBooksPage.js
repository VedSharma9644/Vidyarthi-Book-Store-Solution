import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, colors } from '../css/styles';
import BottomNavigation from './BottomNavigation';
import ApiService from '../services/apiService';

const GradeBooksPage = ({ onTabPress, onBack, gradeId, gradeName, schoolId }) => {
  const [textbooks, setTextbooks] = useState([]);
  const [optionalItems, setOptionalItems] = useState([]);
  const [selectedOptionalItems, setSelectedOptionalItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadBooks();
  }, [gradeId]);

  useEffect(() => {
    // Load cart count on component mount and when component comes into focus
    loadCartCount();
    
    // Set up interval to refresh cart count every 5 seconds
    const interval = setInterval(() => {
      loadCartCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const result = await ApiService.getCartCount();
      if (result.success) {
        setCartCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      // Don't show error to user, just set count to 0
      setCartCount(0);
    }
  };

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch books for this grade
      // Books are linked to categories, and categories are linked to grades
      // Step 1: Get all categories for this grade
      const categoriesResult = await ApiService.getCategoriesByGradeId(gradeId);
      
      if (!categoriesResult.success || !categoriesResult.data || categoriesResult.data.length === 0) {
        setTextbooks([]);
        setOptionalItems([]);
        setIsLoading(false);
        return;
      }

      const categoryIds = categoriesResult.data.map(cat => cat.id);
      
      // Step 2: Fetch books for these categories
      // We'll need to fetch books and filter by categoryId
      // For now, fetch all books and filter client-side
      // TODO: Update books API to support filtering by categoryIds array
      const booksResult = await ApiService.getAllBooks({ limit: 200 });
      
      if (booksResult.success && booksResult.data) {
        // Filter books that belong to categories of this grade
        const books = booksResult.data.filter(book => 
          book.categoryId && categoryIds.includes(book.categoryId)
        );
        
        // Separate textbooks from other items
        const textbooksList = [];
        const optionalList = [];
        const defaultSelected = new Set();
        
        books.forEach(book => {
          const bookItem = {
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description || '',
            coverImageUrl: book.coverImageUrl || '',
            price: book.price || 0,
            discountPrice: book.discountPrice || null,
            bookType: book.bookType || '',
          };

          // TEXTBOOK is mandatory, everything else is optional
          if (book.bookType === 'TEXTBOOK') {
            textbooksList.push(bookItem);
          } else {
            optionalList.push(bookItem);
            // All optional items are selected by default
            defaultSelected.add(book.id);
          }
        });

        setTextbooks(textbooksList);
        setOptionalItems(optionalList);
        setSelectedOptionalItems(defaultSelected);
      } else {
        setError(booksResult.message || 'Failed to load books');
      }
    } catch (error) {
      console.error('Error loading books:', error);
      setError('Failed to load books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOptionalItem = (itemId) => {
    setSelectedOptionalItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);

      // Get all items to add: all textbooks + selected optional items
      const itemsToAdd = [
        ...textbooks.map(book => book.id),
        ...Array.from(selectedOptionalItems),
      ];

      if (itemsToAdd.length === 0) {
        Alert.alert('No Items', 'Please select at least one item to add to cart.');
        setIsAddingToCart(false);
        return;
      }

      // Add each item to cart
      let successCount = 0;
      let failCount = 0;

      for (const itemId of itemsToAdd) {
        try {
          // Assuming we have an addToCart API that takes bookId and quantity
          // For now, we'll use updateCartItem with quantity 1
          const result = await ApiService.updateCartItem(itemId, 1);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error adding item ${itemId} to cart:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        // Reload cart count after adding items
        await loadCartCount();
        
        Alert.alert(
          'Success',
          `${successCount} item(s) added to cart${failCount > 0 ? `, ${failCount} failed` : ''}.`,
          [
            {
              text: 'View Cart',
              onPress: () => {
                onTabPress('cart');
              },
            },
            {
              text: 'Continue Shopping',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to add items to cart. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add items to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#06412c" />
          <Text style={{ marginTop: 16, color: '#0e1b16' }}>
            Loading books...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#0e1b16', marginBottom: 10, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: '#06412c',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={onBack}
          >
            <Text style={{ color: '#f8fcfa', fontSize: 16, fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fcfa' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        shadowColor: colors.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
        <TouchableOpacity
          style={{ width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }}
          onPress={onBack}
        >
          <Text style={{ fontSize: 24, color: colors.white }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.white,
        }}>
          {gradeName || 'Grade Books'}
        </Text>
        <TouchableOpacity
          style={{ 
            width: 48, 
            height: 48, 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'relative',
          }}
          onPress={() => onTabPress('cart')}
        >
          <Text style={{ fontSize: 24, color: colors.white }}>🛒</Text>
          {cartCount > 0 && (
            <View style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: '#e74c3c',
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 6,
            }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 'bold',
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Mandatory Textbooks Section */}
        {textbooks.length > 0 && (
          <>
            <Text style={{
              color: '#0e1b16',
              fontSize: 22,
              fontWeight: 'bold',
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 12,
            }}>
              Mandatory Textbooks
            </Text>

            {textbooks.map((book) => {
              const imageUri = book.coverImageUrl && book.coverImageUrl.trim() !== '' 
                ? book.coverImageUrl 
                : null;
              
              return (
              <View key={book.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f8fcfa',
                paddingHorizontal: 16,
                minHeight: 72,
                paddingVertical: 8,
                gap: 16,
              }}>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  backgroundColor: '#e7f3ef',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{
                        width: 56,
                        height: 56,
                      }}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('Image load error:', error.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <Text style={{ color: '#4d997e', fontSize: 20 }}>📚</Text>
                  )}
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    style={{
                      color: '#0e1b16',
                      fontSize: 16,
                      fontWeight: '500',
                    }}
                    numberOfLines={1}
                  >
                    {book.title}
                  </Text>
                  <Text
                    style={{
                      color: '#4d997e',
                      fontSize: 14,
                      fontWeight: '400',
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {book.description || book.author || 'Textbook'}
                  </Text>
                </View>
              </View>
            );
            })}
          </>
        )}

        {/* Optional Items Section */}
        {optionalItems.length > 0 && (
          <>
            <Text style={{
              color: '#0e1b16',
              fontSize: 22,
              fontWeight: 'bold',
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 12,
            }}>
              Optional Items
            </Text>

            {optionalItems.map((item) => {
              const isSelected = selectedOptionalItems.has(item.id);
              const imageUri = item.coverImageUrl && item.coverImageUrl.trim() !== '' 
                ? item.coverImageUrl 
                : null;
              
              return (
                <View key={item.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#f8fcfa',
                  paddingHorizontal: 16,
                  minHeight: 72,
                  paddingVertical: 8,
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                    <View style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      backgroundColor: '#e7f3ef',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                    }}>
                      {imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{
                            width: 56,
                            height: 56,
                          }}
                          resizeMode="cover"
                          onError={(error) => {
                            console.log('Image load error:', error.nativeEvent.error);
                          }}
                        />
                      ) : (
                        <Text style={{ color: '#4d997e', fontSize: 20 }}>📚</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text
                        style={{
                          color: '#0e1b16',
                          fontSize: 16,
                          fontWeight: '500',
                        }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{
                          color: '#4d997e',
                          fontSize: 14,
                          fontWeight: '400',
                          marginTop: 2,
                        }}
                        numberOfLines={2}
                      >
                        {item.description || item.bookType || 'Optional item'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      width: 28,
                      height: 28,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => toggleOptionalItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: isSelected ? '#06412c' : '#d0e7df',
                      backgroundColor: isSelected ? '#06412c' : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      {isSelected && (
                        <Text style={{ color: '#f8fcfa', fontSize: 14, fontWeight: 'bold', lineHeight: 16 }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Empty State */}
        {textbooks.length === 0 && optionalItems.length === 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 40 }}>
            <Text style={{
              color: '#666',
              fontSize: 16,
              textAlign: 'center',
            }}>
              No books available for this grade
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add to Cart Button - Fixed at bottom */}
      {(textbooks.length > 0 || optionalItems.length > 0) && (
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: '#e7f3ef',
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <TouchableOpacity
            style={{
              width: '100%',
              height: 52,
              backgroundColor: '#06412c',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
            onPress={handleAddToCart}
            disabled={isAddingToCart}
            activeOpacity={0.8}
          >
            {isAddingToCart ? (
              <>
                <ActivityIndicator size="small" color="#f8fcfa" />
                <Text style={{
                  color: '#f8fcfa',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginLeft: 8,
                }}>
                  Adding...
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 20 }}>🛒</Text>
                <Text style={{
                  color: '#f8fcfa',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                  Add All to Cart
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={{
            color: '#666',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 8,
          }}>
            {textbooks.length} mandatory textbook{textbooks.length !== 1 ? 's' : ''} + {selectedOptionalItems.size} optional item{selectedOptionalItems.size !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default GradeBooksPage;

