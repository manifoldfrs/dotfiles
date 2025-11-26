FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    zsh \
    curl \
    git \
    sudo \
    locales \
    && locale-gen en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Create test user (simulates fresh machine)
RUN useradd -m -s /bin/zsh testuser && \
    echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER testuser
WORKDIR /home/testuser

# Copy dotfiles
COPY --chown=testuser:testuser . /home/testuser/dotfiles

# Run test script
CMD ["bash", "/home/testuser/dotfiles/test/run_tests.sh"]
