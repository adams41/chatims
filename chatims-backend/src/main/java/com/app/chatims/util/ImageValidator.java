package com.app.chatims.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public final class ImageValidator {

    public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public enum ImageType { JPEG, PNG, WEBP }

    private ImageValidator() {}

    /**
     * Validate the uploaded file is a real image by reading the first bytes.
     * Returns the detected type, or throws IllegalArgumentException with a safe message.
     */
    public static ImageType validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo is required.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Photo too large (max 5MB).");
        }
        byte[] head;
        try (var in = file.getInputStream()) {
            head = in.readNBytes(16);
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read uploaded file.");
        }
        ImageType detected = detect(head);
        if (detected == null) {
            throw new IllegalArgumentException("Invalid file type. Use JPG, PNG, or WebP.");
        }
        return detected;
    }

    private static ImageType detect(byte[] h) {
        if (h.length < 12) return null;
        // JPEG: FF D8 FF
        if ((h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) return ImageType.JPEG;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G'
                && (h[4] & 0xFF) == 0x0D && (h[5] & 0xFF) == 0x0A) return ImageType.PNG;
        // WebP: "RIFF"...."WEBP"
        if (h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') return ImageType.WEBP;
        return null;
    }

    public static String extensionFor(ImageType type) {
        return switch (type) {
            case JPEG -> ".jpg";
            case PNG -> ".png";
            case WEBP -> ".webp";
        };
    }
}
