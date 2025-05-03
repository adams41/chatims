package com.app.chatims.service;

public interface KeycloakService {
    String registerUserInKeycloak(String username, String email, String password);
}
