import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles, colors } from '../css/styles';

const BottomNavigation = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.bottomNavigation}>
      <View style={styles.bottomNavContent}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.bottomNavItem}
            onPress={() => onTabPress(tab.id)}
          >
            <Text
              style={[
                styles.bottomNavIcon,
                activeTab === tab.id && styles.bottomNavIconActive,
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.bottomNavLabel,
                activeTab === tab.id && styles.bottomNavLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.bottomNavSpacer} />
    </View>
  );
};

export default BottomNavigation;
