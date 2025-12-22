import React from 'react';
import { styles, colors } from '../css/styles';

const BottomNavigation = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={styles.bottomNavigation}>
      <div style={styles.bottomNavContent}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={styles.bottomNavItem}
            onClick={() => onTabPress && onTabPress(tab.id)}
          >
            <span
              style={{
                ...styles.bottomNavIcon,
                ...(activeTab === tab.id && styles.bottomNavIconActive),
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                ...styles.bottomNavLabel,
                ...(activeTab === tab.id && styles.bottomNavLabelActive),
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;


