import React from "react";
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    createHttpLink,
} from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);

    return render(ui, { wrapper: BrowserRouter });
};

const ENDPOINT = "https://jsramverk-editor-eaja20.azurewebsites.net";

const httpLink = createHttpLink({
    uri: `${ENDPOINT}/graphql`,
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('token');

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

const client = new ApolloClient({
    uri: 'http://localhost:1337',
    link: authLink.concat(httpLink),
    cache: new InMemoryCache()
});


test('renders navbar', () => {
    renderWithRouter(<App />);
    const navElement = screen.getByText('Ewelinas online editor');

    expect(navElement).toBeInTheDocument();
});

test('clicking link "create your account" renders register', () => {
    renderWithRouter(<App />);
    fireEvent.click(screen.getByText('create your account'));
    expect(screen.getByText('Register')).toBeInTheDocument();
});

test('clicking link "login" renders first page', () => {
    renderWithRouter(<App />, { route: '/signup' });
    fireEvent.click(screen.getByText('login'));
    expect(screen.getByText('Login')).toBeInTheDocument();
});

test('clicking button "Save" without title and content renders alert', () => {
    global.localStorage = {
        store: {},
        getItem: (key)=>this.store[key],
        setItem: (key, value)=> this.store[key] = value
    };
    global.localStorage.setItem("token", "mocked-token");

    renderWithRouter(<ApolloProvider client={client}>
        <App />
    </ApolloProvider>, { route: '/editor' });
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    fireEvent.click(screen.getByText('Save'));

    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith(
        "Can't create a document without a title and/or content!"
    );
});
