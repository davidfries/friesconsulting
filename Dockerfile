# Use the official Hugo image as the base image
FROM klakegg/hugo:ext-alpine

# Set the working directory inside the container
WORKDIR /src

# Copy the current directory contents into the container at /site
COPY . /src

# Expose port 1313 to the outside world
EXPOSE 1313

# Command to run Hugo server
CMD ["hugo", "server", "--bind", "0.0.0.0"]
