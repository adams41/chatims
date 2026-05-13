package com.app.chatims.exception;

public class MessageSendException extends RuntimeException {

    public MessageSendException(String message) {
        super(message);
    }

    public MessageSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
