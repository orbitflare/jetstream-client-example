package config

// ClientConfig represents the command-line configuration
type ClientConfig struct {
	JetstreamGrpcURL  string   `json:"jetstream_grpc_url"`
	XToken            string   `json:"x_token"`
	FilterConfigPath  string   `json:"filter_config_path"`
	IncludeAccounts   []string `json:"include_accounts"`
	ExcludeAccounts   []string `json:"exclude_accounts"`
	RequiredAccounts  []string `json:"required_accounts"`
	ParsedEnabled     bool     `json:"parsed_enabled"`
}

// FilterConfig represents a transaction filter configuration loaded from JSON
type FilterConfig struct {
	Filters map[string]Filter `json:"filters"`
}

// Filter represents individual filter settings
type Filter struct {
	AccountInclude  []string `json:"account_include"`
	AccountExclude  []string `json:"account_exclude"`
	AccountRequired []string `json:"account_required"`
} 