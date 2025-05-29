import { ErrorBoundary as SolidErrorBoundary } from "solid-js";
import { Alert, Button, Container } from "solid-bootstrap";
import { type Component, type ParentComponent } from "solid-js";

const ErrorFallback: Component<{ error: Error; reset: () => void }> = (
  props,
) => {
  return (
    <Container fluid class="p-4">
      <Alert variant="danger">
        <Alert.Heading>
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Something went wrong
        </Alert.Heading>
        <p class="mb-3">
          An unexpected error occurred. This shouldn't happen, but we've caught
          it to prevent the entire application from crashing.
        </p>

        <details class="mb-3">
          <summary class="mb-2" style="cursor: pointer;">
            <strong>Error Details</strong>
          </summary>
          <div class="bg-light p-3 rounded">
            <strong>Error:</strong> {props.error.message}
            {props.error.stack && (
              <>
                <hr />
                <pre
                  class="mb-0"
                  style="font-size: 0.85em; white-space: pre-wrap;"
                >
                  {props.error.stack}
                </pre>
              </>
            )}
          </div>
        </details>

        <div class="d-flex gap-2">
          <Button variant="primary" onClick={props.reset}>
            <i class="bi bi-arrow-clockwise me-1"></i>
            Try Again
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => window.location.reload()}
          >
            <i class="bi bi-arrow-repeat me-1"></i>
            Reload Page
          </Button>
        </div>
      </Alert>
    </Container>
  );
};

export const AppErrorBoundary: ParentComponent = (props) => {
  return (
    <SolidErrorBoundary
      fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}
    >
      {props.children}
    </SolidErrorBoundary>
  );
};
