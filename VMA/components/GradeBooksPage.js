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
  const [optionalItemsByType, setOptionalItemsByType] = useState({});


  const [selectedBundles, setSelectedBundles] = useState({
    NOTEBOOK: true,
    UNIFORM: true,
    STATIONARY: true,
    OTHER: true,
  });
  
  // State for dropdown expansion (open by default)
  const [expandedSections, setExpandedSections] = useState({
    mandatoryTextbooks: true,
    optionalItems: true,
  });
  
  // State for individual optional bundle expansion (open by default)
  const [expandedBundles, setExpandedBundles] = useState({});
  
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
        setOptionalItemsByType({});
        setIsLoading(false);
        return;
      }
      

      const categoryIds = categoriesResult.data.map(cat => cat.id);
      
      // Step 2: Fetch books for these categories
      // Fetch all books with pagination to ensure we get all products
      let allBooks = [];
      let offset = 0;
      const limit = 100; // Fetch in batches of 100
      let hasMore = true;
      
      // Fetch all books in batches until we get all of them
      while (hasMore) {
        const booksResult = await ApiService.getAllBooks({ offset, limit });
        
        if (booksResult.success && booksResult.data && booksResult.data.length > 0) {
          allBooks = allBooks.concat(booksResult.data);
          
          // If we got fewer books than the limit, we've reached the end
          if (booksResult.data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        } else {
          hasMore = false;
        }
      }
      
      if (allBooks.length > 0) {
        // Filter books that belong to categories of this grade
        const books = allBooks.filter(book => 
          book.categoryId && categoryIds.includes(book.categoryId)
        );
        
        // Separate textbooks from other items
        const textbooksList = [];
        const optionalList = [];
        const optionalByType = {};



        
        books.forEach(book => {
          // Filter out "N/A" values and treat them as empty
          // const cleanAuthor = book.author && book.author !== 'N/A' && book.author.trim() !== '' ? book.author : null;
          // const cleanDescription = book.description && book.description !== 'N/A' && book.description.trim() !== '' ? book.description : null;
          
          // Handle price - check multiple possible price fields
          // API might return price, unitPrice, salePrice, or other variations
          let itemPrice = 0;
          
          // Try price field first (most common)
          if (book.price !== null && book.price !== undefined && book.price !== '' && book.price !== 0) {
            const parsedPrice = parseFloat(book.price);
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              itemPrice = parsedPrice;
            }
          }
          
          // If price is still 0 or invalid, try alternative fields
          if (itemPrice === 0 || isNaN(itemPrice)) {
            if (book.unitPrice !== null && book.unitPrice !== undefined && book.unitPrice !== '' && book.unitPrice !== 0) {
              const parsedPrice = parseFloat(book.unitPrice);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                itemPrice = parsedPrice;
              }
            } else if (book.salePrice !== null && book.salePrice !== undefined && book.salePrice !== '' && book.salePrice !== 0) {
              const parsedPrice = parseFloat(book.salePrice);
              if (!isNaN(parsedPrice) && parsedPrice > 0) {
                itemPrice = parsedPrice;
              }
            }
          }
          
          // Log price issues for debugging (only for optional items)
          if (book.bookType !== 'TEXTBOOK' && (itemPrice === 0 || itemPrice === 0.10)) {
            console.log(`⚠️ Price issue for optional item ${book.id} (${book.title}):`, {
              price: book.price,
              unitPrice: book.unitPrice,
              salePrice: book.salePrice,
              finalPrice: itemPrice,
              allFields: Object.keys(book).filter(k => k.toLowerCase().includes('price'))
            });
          }
          
          const bookItem = {
            id: book.id,
            title: book.title,
            // author: cleanAuthor,
            // description: cleanDescription,
            coverImageUrl: book.coverImageUrl || '',
            price: itemPrice,
            bookType: book.bookType || '',
            productQuantity: book.productQuantity || null,
            perProductPrice: book.perProductPrice || null,

          };

          // TEXTBOOK is mandatory, everything else is optional (combo)
          if (book.bookType === 'TEXTBOOK') {
            textbooksList.push(bookItem);
          } else {
            const typeKey = book.bookType || 'OTHER';
          
            if (!optionalByType[typeKey]) {
              optionalByType[typeKey] = {
                type: typeKey,
                title: typeKey.charAt(0) + typeKey.slice(1).toLowerCase(),
                items: [],
              };
            }
          
            optionalList.push(bookItem);
            optionalByType[typeKey].items.push(bookItem);
          }
          
          
        });

        setTextbooks(textbooksList);
        setOptionalItems(optionalList);
        setOptionalItemsByType(optionalByType);
        
        // Initialize expanded bundles state (all open by default)
        const initialExpandedBundles = {};
        Object.keys(optionalByType).forEach(type => {
          initialExpandedBundles[type] = true;
        });
        setExpandedBundles(initialExpandedBundles);
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

  

    // Calculate combo total price
    const calculateComboTotal = () => {
      return Object.entries(optionalItemsByType).reduce((sum, [type, group]) => {
        if (!selectedBundles[type]) return sum;
    
        return (
          sum +
          group.items.reduce((itemSum, item) => itemSum + (item.price || 0), 0)
        );
      }, 0);
    };
  
    const toggleBundle = (type) => {
      setSelectedBundles((prev) => ({
        ...prev,
        [type]: !prev[type],
      }));
    };
    
    const toggleSection = (section) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    };
    
    const toggleBundleExpansion = (type) => {
      setExpandedBundles((prev) => ({
        ...prev,
        [type]: !prev[type],
      }));
    };
    
  

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);

      // Get all items to add: all textbooks + optional items combo (if selected)
      const itemsToAdd = [...textbooks.map(book => book.id)];
      
      // Add all optional items if combo is selected
      Object.entries(optionalItemsByType).forEach(([type, group]) => {
        if (selectedBundles[type]) {
          itemsToAdd.push(...group.items.map(item => item.id));
        }
      });
      

      if (itemsToAdd.length === 0) {
        Alert.alert('No Items', 'Please select at least one item to add to cart.');
        setIsAddingToCart(false);
        return;
      }

      // Clear existing cart first before adding new items
      // This ensures only one grade/order can be in the cart at a time
      try {
        console.log('Clearing existing cart before adding new items...');
        const clearResult = await ApiService.clearCart();
        
        if (!clearResult.success) {
          Alert.alert(
            'Cart Clear Failed',
            'Failed to clear existing cart. Please try again.',
            [{ text: 'OK' }]
          );
          setIsAddingToCart(false);
          return;
        }
        
        console.log('Cart cleared successfully');
        
        // Wait a moment to ensure cart is fully cleared on backend
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error clearing cart:', error);
        Alert.alert(
          'Error',
          'Failed to clear existing cart. Please try again.',
          [{ text: 'OK' }]
        );
        setIsAddingToCart(false);
        return;
      }

      // Add each item to cart
      let successCount = 0;
      let failCount = 0;

      for (const itemId of itemsToAdd) {
        try {
          const result = await ApiService.updateCartItem(itemId, 1);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to add item ${itemId}:`, result.message);
          }
        } catch (error) {
          console.error(`Error adding item ${itemId} to cart:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        // Reload cart count after adding items
        await loadCartCount();
        
        // Show success message
        Alert.alert(
          'Items Added',
          `${successCount} item(s) added to cart successfully.${failCount > 0 ? ` ${failCount} item(s) failed to add.` : ''}`,
          [{ text: 'OK' }]
        );
        
        // Automatically navigate to cart page
        onTabPress('cart');
      } else {
        Alert.alert('Error', 'Failed to add items to cart. Please try again.');
        setIsAddingToCart(false);
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
            <TouchableOpacity
              onPress={() => toggleSection('mandatoryTextbooks')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <Text style={{
                color: '#0e1b16',
                fontSize: 22,
                fontWeight: 'bold',
              }}>
                Mandatory Textbooks
              </Text>
              <Text style={{
                fontSize: 20,
                color: '#06412c',
              }}>
                {expandedSections.mandatoryTextbooks ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedSections.mandatoryTextbooks && textbooks.map((book) => {
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
                  {/* Code for showing per product price and product quantity in the mobile app*/}
                  <View style={{ marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ flex: 1, fontSize: 12, color: '#555' }}>Per Unit</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#555', textAlign: 'center' }}>Qty</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#555', textAlign: 'right' }}>Total</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#06412c' }}>
                        ₹{book.perProductPrice || '-'}
                      </Text>

                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#06412c', textAlign: 'center' }}>
                        {book.productQuantity || '-'}
                      </Text>

                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#06412c', textAlign: 'right' }}>
                        ₹{book.price}
                      </Text>
                    </View>
                  </View>

                </View>
              </View>
            );
            })}
          </>
        )}

        {/* Optional Items Combo Section */}
        {Object.keys(optionalItemsByType).length > 0 && (
          <>
            <TouchableOpacity
              onPress={() => toggleSection('optionalItems')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <Text style={{
                color: '#0e1b16',
                fontSize: 22,
                fontWeight: 'bold',
              }}>
                Optional Items Combo
              </Text>
              <Text style={{
                fontSize: 20,
                color: '#06412c',
              }}>
                {expandedSections.optionalItems ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>



            {/* Optional Items List (book-type wise) */}
            {expandedSections.optionalItems && Object.values(selectedBundles).some(bundle => bundle) &&
              Object.values(optionalItemsByType).map((group) => (
                <View key={group.type}>

                  {/* Category Title with Checkbox and Expand/Collapse */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 8,
                  }}>
                    <TouchableOpacity
                      onPress={() => toggleBundle(group.type)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: selectedBundles[group.type] ? '#06412c' : '#ccc',
                          backgroundColor: selectedBundles[group.type] ? '#06412c' : 'transparent',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 10,
                        }}
                      >
                        {selectedBundles[group.type] && (
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>

                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: '#0e1b16',
                        }}
                      >
                        {group.title}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => toggleBundleExpansion(group.type)}
                      style={{
                        padding: 4,
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        color: '#06412c',
                      }}>
                        {expandedBundles[group.type] ? '▼' : '▶'}
                      </Text>
                    </TouchableOpacity>
                  </View>


                  {selectedBundles[group.type] && expandedBundles[group.type] &&
                    group.items.map((item) => {

                    const imageUri =
                      item.coverImageUrl && item.coverImageUrl.trim() !== ''
                        ? item.coverImageUrl
                        : null;

                    return (
                      <View
                        key={item.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#f8fcfa',
                          paddingHorizontal: 16,
                          minHeight: 64,
                          paddingVertical: 8,
                          marginBottom: 4,
                        }}
                      >
                        {/* Image */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            backgroundColor: '#e7f3ef',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {imageUri ? (
                            <Image
                              source={{ uri: imageUri }}
                              style={{ width: 48, height: 48 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={{ fontSize: 18 }}>📦</Text>
                          )}
                        </View>

                        {/* Details */}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text
                            style={{
                              color: '#0e1b16',
                              fontSize: 15,
                              fontWeight: '500',
                            }}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>

                          {/* Per Unit | Qty */}
                          <View style={{ marginTop: 6 }}>
                            <View style={{ flexDirection: 'row' }}>
                              <Text style={{ flex: 1, fontSize: 12, color: '#555' }}>
                                Per Unit
                              </Text>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 12,
                                  color: '#555',
                                  textAlign: 'center',
                                }}
                              >
                                Qty
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', marginTop: 2 }}>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: '#06412c',
                                }}
                              >
                                ₹{item.perProductPrice || '-'}
                              </Text>

                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: '#06412c',
                                  textAlign: 'center',
                                }}
                              >
                                {item.productQuantity || '-'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Total Price */}
                        <Text
                          style={{
                            color: '#06412c',
                            fontSize: 15,
                            fontWeight: 'bold',
                          }}
                        >
                          ₹{item.price.toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}

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
            {textbooks.length} mandatory textbook{textbooks.length !== 1 ? 's' : ''}
            {Object.entries(selectedBundles).some(
              ([type, selected]) => selected && optionalItemsByType[type]
            ) && (
              <> + Optional bundles selected</>
            )}

          </Text>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="search" onTabPress={onTabPress} />
    </SafeAreaView>
  );
};

export default GradeBooksPage;

