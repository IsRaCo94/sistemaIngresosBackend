import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IngresoExternoService {
  private loginBaseUrl = 'http://10.0.10.217:3000/api';
  private dataBaseUrl = 'http://10.0.10.218:4001/api/v1';
  private username: string;
  private password: string;
  private apiToken: string | null = null;
  private loginPromise: Promise<any> | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.username = this.configService.get<string>('API1_USERNAME') || '';
    this.password = this.configService.get<string>('API1_PASSWORD') || '';
    
    console.log('🔧 IngresoExternoService inicializado:');
    console.log(`  Usuario: ${this.username}`);
    console.log(`  Login URL: ${this.loginBaseUrl}`);
    console.log(`  Data URL: ${this.dataBaseUrl}`);
  }

  async loginToExternalApi(): Promise<any> {
    if (this.loginPromise) {
      console.log('🔄 Login ya en progreso, esperando...');
      return await this.loginPromise;
    }

    if (!this.username || !this.password) {
      throw new Error('❌ Credenciales no configuradas. Verifica API1_USERNAME y API1_PASSWORD');
    }

    console.log(`🔐 Intentando login con usuario: ${this.username}`);

    const params = new URLSearchParams();
    params.append('username', this.username);
    params.append('password', this.password);

    this.loginPromise = (async () => {
      try {
        console.log(`📡 POST ${this.loginBaseUrl}/auth/login`);

        const response = await firstValueFrom(
          this.httpService.post(`${this.loginBaseUrl}/auth/login`, params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 10000,
          }),
        );

        // Guardar el token correctamente
        this.apiToken = response.data.systems?.[0]?.token;
        
        console.log(`✅ Login exitoso!`);
        console.log(`🔑 Token guardado: ${this.apiToken ? 'Sí (' + this.apiToken.substring(0, 20) + '...)' : 'No'}`);
        
        if (!this.apiToken) {
          throw new Error('❌ No se recibió token válido del servidor de autenticación');
        }
        
        console.log(`📄 Respuesta:`, JSON.stringify(response.data, null, 2));

        return {
          status: true,
          data: response.data,
          message: 'Inicio de sesión exitoso',
        };
      } catch (error: any) {
        console.error('❌ Error en login:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        this.apiToken = null;
        throw new Error(`Error al iniciar sesión: ${error.response?.data?.message || error.message}`);
      } finally {
        this.loginPromise = null;
      }
    })();

    return await this.loginPromise;
  }

  private async handleRequest<T>(requestFn: () => Promise<T>, methodName: string): Promise<T> {
    console.log(`\n🚀 === ${methodName} ===`);
    
    if (!this.apiToken) {
      console.log(`🔑 No hay token, solicitando login...`);
      await this.loginToExternalApi();
    }
    
    console.log(`🔑 Token actual: ${this.apiToken ? 'Disponible' : 'No disponible'}`);
    if (this.apiToken) {
      console.log(`🔑 Longitud del token: ${this.apiToken.length} caracteres`);
    }

    try {
      const result = await requestFn();
      console.log(`✅ ${methodName} completado exitosamente`);
      return result;
    } catch (error: any) {
      console.error(`❌ Error en ${methodName}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      if (error.response?.status === 401) {
        console.log(`🔄 Token expirado o inválido, renovando...`);
        
        // Limpiar token e intentar de nuevo
        this.apiToken = null;
        
        try {
          await this.loginToExternalApi();
          console.log(`🔄 Reintentando ${methodName} con nuevo token...`);
          return await requestFn();
        } catch (loginError: any) {
          console.error(`❌ Error al renovar token:`, loginError.message);
          throw new Error(`Error de autenticación en ${methodName}: ${loginError.message}`);
        }
      }

      throw error;
    }
  }

  getApiToken(): string | null {
    return this.apiToken;
  }

  async getAportes(num_form: number): Promise<any> {
    return this.handleRequest(async () => {
      const url = `${this.dataBaseUrl}/pagos-aportes/by-com-nro/${num_form}`;
      console.log(`📡 GET ${url}`);
      
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
          timeout: 10000,
        }),
      );

      console.log(`📄 Respuesta recibida:`, {
        status: response.status,
        dataKeys: Object.keys(response.data),
        dataType: typeof response.data
      });

      // Adaptar según la estructura real de la respuesta
      return response.data;
    }, 'getAportes');
  }
}