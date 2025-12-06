# Criptomonedas Más Baratas para Pruebas

## 💰 Opciones Recomendadas (de más barata a menos barata)

### 1. **USDT en Tron (TRC-20)** ⭐ RECOMENDADA
- **Código:** `usdttrc20`
- **Comisión:** Gratuita (Gas Free desde marzo 2025)
- **Ventaja:** Sin comisiones de transacción
- **Desventaja:** Requiere tener USDT en wallet Tron

### 2. **XRP (Ripple)**
- **Código:** `xrp`
- **Comisión:** Menos de $0.01 USD
- **Ventaja:** Muy rápida y barata
- **Desventaja:** Requiere tener XRP

### 3. **TRX (Tron)**
- **Código:** `trx`
- **Comisión:** Muy baja (reducida 60% en agosto 2025)
- **Ventaja:** Red Tron, comisiones mínimas
- **Desventaja:** Requiere tener TRX

### 4. **USDT en Polygon**
- **Código:** `usdtpolygon` o `usdtm`
- **Comisión:** Muy baja (red Polygon)
- **Ventaja:** Red rápida y barata
- **Desventaja:** Requiere tener USDT en Polygon

## 🎯 Recomendación para Pruebas

**Para pruebas, usa: `usdttrc20` (USDT en Tron)**

**Razones:**
- ✅ Sin comisiones (Gas Free)
- ✅ Transacciones rápidas
- ✅ USDT es una stablecoin (valor estable = $1 USD)
- ✅ Ampliamente aceptada

## 📝 Cómo Cambiar la Criptomoneda en el Código

En `ConsultaRUCPagada.js`, línea ~26, puedes cambiar:

```javascript
const payCurrency = 'usdttrc20' // Cambia aquí
```

**Opciones disponibles:**
- `usdttrc20` - USDT en Tron (más barato) ⭐
- `xrp` - XRP (muy barato)
- `trx` - Tron (barato)
- `usdtm` - USDT en Polygon (barato)
- `btc` - Bitcoin (más caro)
- `eth` - Ethereum (más caro)

## ⚠️ Nota Importante

Now Payments puede tener limitaciones en qué criptomonedas acepta. Verifica en tu dashboard de Now Payments qué criptomonedas están disponibles para tu cuenta.

## 🔍 Verificar Criptomonedas Disponibles

1. Ve a Now Payments Dashboard
2. Settings → Payments → Payment details
3. Revisa qué criptomonedas están habilitadas
4. Asegúrate de que la criptomoneda que elijas esté disponible

