import { Component, ReactNode } from "react";

type Props = { 
  fallback?: ReactNode; 
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundaryLocal extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[ErrorBoundaryLocal] Erro capturado:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-destructive font-medium">Algo deu errado ao carregar esta tela.</p>
          {this.state.error && (
            <p className="text-sm text-muted-foreground mt-2">{this.state.error.message}</p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
