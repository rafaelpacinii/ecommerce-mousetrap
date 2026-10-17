# Stage 1: Build Quarkus application using Maven
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /project
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*

# Cache Maven wrapper and dependencies
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN --mount=type=cache,target=/root/.m2 ./mvnw dependency:go-offline -B

# Copy source code and build Quarkus fast-jar application
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -Prelease package -DskipTests

# Stage 2: Runtime image using Red Hat UBI OpenJDK 17
FROM registry.access.redhat.com/ubi9/openjdk-17-runtime:1.24
ENV LANGUAGE='en_US:en'

COPY --chown=185 --from=build /project/target/quarkus-app/lib/ /deployments/lib/
COPY --chown=185 --from=build /project/target/quarkus-app/*.jar /deployments/
COPY --chown=185 --from=build /project/target/quarkus-app/app/ /deployments/app/
COPY --chown=185 --from=build /project/target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8080
USER 185
ENV JAVA_OPTS_APPEND="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENV JAVA_APP_JAR="/deployments/quarkus-run.jar"

ENTRYPOINT [ "/opt/jboss/container/java/run/run-java.sh" ]

