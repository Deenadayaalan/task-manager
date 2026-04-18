# infrastructure/Makefile
.PHONY: help init plan apply destroy validate format clean setup-backend

# Default environment
ENV ?= dev

help: ## Show this help message
	@echo 'Usage: make [target] [ENV=environment]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup-backend: ## Setup Terraform backend (S3 + DynamoDB)
	@echo "Setting up Terraform backend..."
	@chmod +x scripts/setup-backend.sh
	@./scripts/setup-backend.sh

init: ## Initialize Terraform
	@echo "Initializing Terraform for $(ENV)..."
	@terraform init

validate: ## Validate Terraform configuration
	@echo "Validating Terraform configuration..."
	@terraform validate

format: ## Format Terraform code
	@echo "Formatting Terraform code..."
	@terraform fmt -recursive

plan: init validate ## Plan infrastructure changes
	@echo "Planning infrastructure for $(ENV)..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh $(ENV) plan

apply: ## Apply infrastructure changes
	@echo "Applying infrastructure for $(ENV)..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh $(ENV) apply

destroy: ## Destroy infrastructure
	@echo "Destroying infrastructure for $(ENV)..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh $(ENV) destroy

clean: ## Clean Terraform files
	@echo "Cleaning Terraform files..."
	@rm -rf .terraform/
	@rm -f *.tfplan
	@rm -f *.tfstate*

output: ## Show Terraform outputs
	@terraform output

# Environment-specific targets
dev-plan: ENV=dev
dev-plan: plan

dev-apply: ENV=dev
dev-apply: apply

staging-plan: ENV=staging
staging-plan: plan

staging-apply: ENV=staging
staging-apply: apply

prod-plan: ENV=prod
prod-plan: plan

prod-apply: ENV=prod
prod-apply: apply