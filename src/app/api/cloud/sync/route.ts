import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Inicializar cliente Redis com variáveis de ambiente do Upstash na Vercel
function getRedisClient() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash Redis credenciais não configuradas.');
  }

  return new Redis({
    url,
    token,
  });
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedisClient();
    const body = await req.json();
    const { action, vaultId, pin, data } = body;

    if (!vaultId || typeof vaultId !== 'string') {
      return NextResponse.json({ success: false, error: 'Código de cofre inválido.' }, { status: 400 });
    }

    const cleanVaultId = vaultId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const redisKey = `fincontrol:vault:${cleanVaultId}`;

    // AÇÃO: PULL (Buscar dados da nuvem para outro dispositivo)
    if (action === 'pull') {
      const record = await redis.get<{
        pin?: string;
        data: any;
        updatedAt: string;
      }>(redisKey);

      if (!record) {
        return NextResponse.json({
          success: false,
          notFound: true,
          error: 'Cofre em nuvem não encontrado. Verifique o código digitado.',
        }, { status: 404 });
      }

      if (record.pin && record.pin !== pin) {
        return NextResponse.json({
          success: false,
          invalidPin: true,
          error: 'Senha/PIN do cofre incorreta.',
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        data: record.data,
        updatedAt: record.updatedAt,
      });
    }

    // AÇÃO: PUSH (Salvar/Sincronizar dados deste dispositivo na nuvem)
    if (action === 'push') {
      if (!data) {
        return NextResponse.json({ success: false, error: 'Nenhum dado enviado para sincronizar.' }, { status: 400 });
      }

      // Se já existir, checar senha/PIN
      const existing = await redis.get<{ pin?: string }>(redisKey);
      if (existing && existing.pin && existing.pin !== pin) {
        return NextResponse.json({
          success: false,
          invalidPin: true,
          error: 'Senha/PIN do cofre não confere com o cofre existente.',
        }, { status: 401 });
      }

      const payload = {
        pin: pin || '',
        data,
        updatedAt: new Date().toISOString(),
      };

      // Gravar com persistência (sem expiração ou TTL longo de 5 anos)
      await redis.set(redisKey, payload);

      return NextResponse.json({
        success: true,
        updatedAt: payload.updatedAt,
      });
    }

    // AÇÃO: STATUS (Checar se cofre existe)
    if (action === 'status') {
      const existing = await redis.get<{ updatedAt: string; pin?: string }>(redisKey);
      return NextResponse.json({
        success: true,
        exists: Boolean(existing),
        hasPin: Boolean(existing?.pin),
        updatedAt: existing?.updatedAt || null,
      });
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida.' }, { status: 400 });
  } catch (err: any) {
    console.error('Erro na rota de sincronização em nuvem:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Erro interno ao sincronizar com a nuvem.',
    }, { status: 500 });
  }
}
