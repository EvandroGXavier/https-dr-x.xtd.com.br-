export interface EvolutionInstance {
  instance: {
    instanceName: string;
    status: string;
  };
}

export interface EvolutionQrCode {
  qrcode: {
    code: string;
    base64: string;
  };
}

export interface EvolutionConnectionState {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
    qrcode?: {
      code: string;
      base64: string;
    };
  };
}

class EvolutionClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async makeRequest(method: string, endpoint: string, data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async createInstance(instanceName: string): Promise<EvolutionInstance> {
    return this.makeRequest('POST', '/instance/create', {
      instanceName,
      qrcode: true,
      webhook: false
    });
  }

  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    return this.makeRequest('GET', `/instance/connectionState/${instanceName}`);
  }

  async generateQrCode(instanceName: string): Promise<EvolutionQrCode> {
    return this.makeRequest('GET', `/instance/connect/${instanceName}`);
  }

  async logout(instanceName: string): Promise<any> {
    return this.makeRequest('DELETE', `/instance/logout/${instanceName}`);
  }

  async deleteInstance(instanceName: string): Promise<any> {
    return this.makeRequest('DELETE', `/instance/delete/${instanceName}`);
  }
}

export { EvolutionClient };