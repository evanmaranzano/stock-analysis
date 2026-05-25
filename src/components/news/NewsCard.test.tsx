// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NewsCard from './NewsCard';
import type { NewsItem } from '../../api/types';

const baseItem: NewsItem = {
  id: '1',
  title: 'Market news',
  url: 'https://example.com/news',
  source: 'Example',
  datetime: '2026-05-25T00:00:00.000Z',
  summary: 'Summary',
};

describe('NewsCard', () => {
  it('does not render unsafe URL protocols as clickable links', () => {
    render(<NewsCard item={{ ...baseItem, url: 'javascript:alert(1)' }} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Market news')).toBeTruthy();
  });
});
