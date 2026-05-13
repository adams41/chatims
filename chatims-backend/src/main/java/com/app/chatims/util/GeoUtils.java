package com.app.chatims.util;

public class GeoUtils {
    private static final double QUANTIZE_STEP_KM = 1.0;
    private static final double KM_PER_DEGREE_LAT = 111.0;
    private static final double METERS_PER_DEGREE_LAT = KM_PER_DEGREE_LAT * 1000;

    /**
     * Quantizes a coordinate to a 1 km grid for privacy.
     * Instead of storing exact coordinates, snap to nearest 1 km grid cell.
     * Example: 40.7128° → 40.712° (rounds to nearest grid point)
     */
    public static double quantizeCoordinate(double coordinate) {
        if (Double.isNaN(coordinate)) {
            return 0.0;
        }
        double metersPerDegree = METERS_PER_DEGREE_LAT;
        double quantizationDegreesLat = QUANTIZE_STEP_KM * 1000 / metersPerDegree;

        return Math.round(coordinate / quantizationDegreesLat) * quantizationDegreesLat;
    }

    /**
     * Quantize both latitude and longitude to 1 km grid.
     * Returns array [quantizedLat, quantizedLon]
     */
    public static double[] quantizeLocation(double latitude, double longitude) {
        return new double[] {
            quantizeCoordinate(latitude),
            quantizeCoordinate(longitude)
        };
    }

    /**
     * Check if two coordinates are in the same 1 km grid cell.
     */
    public static boolean isSameGridCell(double lat1, double lon1, double lat2, double lon2) {
        double quantLat1 = quantizeCoordinate(lat1);
        double quantLon1 = quantizeCoordinate(lon1);
        double quantLat2 = quantizeCoordinate(lat2);
        double quantLon2 = quantizeCoordinate(lon2);

        return Math.abs(quantLat1 - quantLat2) < 0.0001 && Math.abs(quantLon1 - quantLon2) < 0.0001;
    }
}
