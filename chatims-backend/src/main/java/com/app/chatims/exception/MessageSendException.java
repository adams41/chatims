package com.app.chatims.exception;

public class MessageSendException extends RuntimeException{

    public MessageSendException (String message, Exception e) {
        super(message);
    }
}
