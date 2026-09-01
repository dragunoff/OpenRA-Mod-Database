FROM mcr.microsoft.com/devcontainers/typescript-node:24

USER node

RUN curl -fsSL https://opencode.ai/install | bash

USER root

ENV PATH="/home/node/.opencode/bin:${PATH}"