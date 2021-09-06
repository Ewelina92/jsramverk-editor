import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import App from './App';

const renderWithRouter = (ui, {route = '/'} = {}) => {
  window.history.pushState({}, 'Test page', route)

  return render(ui, {wrapper: BrowserRouter})
}


test('renders navbar', () => {
  renderWithRouter(<App />);
  const navElement = screen.getByText('Ewelinas online editor');
  expect(navElement).toBeInTheDocument();
});

test('clicking button "Create New Document" renders editor', () => {
  renderWithRouter(<App />);
  fireEvent.click(screen.getByText('Create New Document'));
  expect(screen.getByText('Save')).toBeInTheDocument();
  expect(screen.getByText('Back to all documents')).toBeInTheDocument();
})

test('clicking button "Back to all documents" renders first page', () => {
  renderWithRouter(<App />, {route: '/editor'});
  fireEvent.click(screen.getByText('Back to all documents'));
  expect(screen.getByText('Create New Document')).toBeInTheDocument();
})

test('clicking button "Save" without title and content renders alert', () => {
  renderWithRouter(<App />, {route: '/editor'});
  const alertMock = jest.spyOn(window,'alert').mockImplementation();
  fireEvent.click(screen.getByText('Save'));

  expect(alertMock).toHaveBeenCalledTimes(1);
  expect(alertMock).toHaveBeenCalledWith("Can't create a document without a title and content!");
})