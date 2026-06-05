import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the calculator heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /Immobilien-Investitionsrechner/i });
  expect(heading).toBeInTheDocument();
});
