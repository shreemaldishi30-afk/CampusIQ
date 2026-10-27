CC = clang
CFLAGS = -std=c11 -Wall -Wextra -Wpedantic -O2
TARGET = campusiq
SOURCES = src/server.c src/graph.c
.PHONY: all run clean
all: $(TARGET)
$(TARGET): $(SOURCES) src/campusiq.h
	$(CC) $(CFLAGS) $(SOURCES) -o $(TARGET)
run: $(TARGET)
	./$(TARGET)
clean:
	rm -f $(TARGET)
