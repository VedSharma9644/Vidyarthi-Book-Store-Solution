import React from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ScrollingNoticeBanner from './ScrollingNoticeBanner';

const BANNER_MATCHERS = [
  { path: '/', end: true },
  { path: '/search', end: true },
  { path: '/school/:schoolId' },
  { path: '/grade/:gradeId' },
  { path: '/grade/:gradeId/sections' },
];

function shouldShowBanner(pathname) {
  return BANNER_MATCHERS.some((matcher) =>
    matchPath({ path: matcher.path, end: matcher.end !== false }, pathname)
  );
}

/**
 * Shows the policy scrolling banner on home / school browse flows
 * (same surfaces as the mobile app).
 */
export default function NoticeBannerGate() {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();

  if (!isLoggedIn || !shouldShowBanner(pathname)) {
    return null;
  }

  return <ScrollingNoticeBanner />;
}
