import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { Rocket } from 'lucide-react';

describe('Frontend Component Tests', () => {
  it('renders StatusBadge with correct text', () => {
    render(React.createElement(StatusBadge, { status: 'SUCCESS' }));
    expect(screen.getByText('Success')).toBeTruthy();
  });

  it('renders StatCard with title and value', () => {
    render(React.createElement(StatCard, { title: 'Total Projects', value: 5, icon: Rocket, color: 'brand' }));
    expect(screen.getByText('Total Projects')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });
});
