import { TextField, Button, InlineStack } from "@shopify/polaris";
import { Form } from "react-router";
import PropTypes from "prop-types";

export function AIForm({ query, setQuery, loading, onSubmit }) {
  return (
    <Form method="post" onSubmit={onSubmit}>
      <input type="hidden" name="intent" value="generate" />
      
      <TextField
        label="Product Title"
        placeholder="e.g. Wireless Headphones, Smart Watch, Yoga Mat"
        value={query}
        onChange={setQuery}
        autoComplete="off"
        helpText="Enter a product name or idea to generate a complete product with AI"
      />

      <input type="hidden" name="query" value={query} />

      <InlineStack align="end" gap="300">
        <Button
          submit
          variant="primary"
          loading={loading}
          disabled={!query.trim() || loading}
        >
          Generate with AI
        </Button>
      </InlineStack>
    </Form>
  );
}

AIForm.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func,
};
