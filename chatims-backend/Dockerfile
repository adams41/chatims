FROM openjdk:21-jdk-slim

WORKDIR /app

COPY target/chatims-0.0.1-SNAPSHOT.war /app/app.war

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.war"]
