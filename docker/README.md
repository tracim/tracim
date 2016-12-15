# How to use Tracim docker images

## For test execution

### Build image

    docker build -t tracim:tests docker/Debian_Tests

### Run tests
      
With SQLite

    docker run -e DATABASE_TYPE=sqlite tracim:tests

With MySQL

    docker run -e DATABASE_TYPE=mysql tracim:tests
    
With PostgreSQL

    docker run -e DATABASE_TYPE=postgresql tracim:tests
