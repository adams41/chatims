package com.app.chatims.dto;

import jakarta.validation.constraints.Size;

public record UpdateContactsRequest(
        @Size(max = 64) String whatsappNumber,
        @Size(max = 64) String telegramHandle,
        @Size(max = 64) String viberNumber
) {
    public boolean hasAtLeastOne() {
        return notBlank(whatsappNumber) || notBlank(telegramHandle) || notBlank(viberNumber);
    }
    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
