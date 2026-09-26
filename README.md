# Landing Page Método G90 — Rogério Gardiano

Landing Page mobile-first de alta conversão para o **Método G90**, projetada para a captação de leads qualificados para o **Raio-X 360º G90**.

---

## 🎯 Objetivo da Aplicação

Levar o visitante através de um fluxo limpo e direto:
1. **Headline & VSL Vertical** (proporção 9:16)
2. **Aparição do CTA** após delay configurável (`CTA_DELAY_MS`)
3. **Modal Popup com Formulário** de qualificação (8 campos com máscara e validação)
4. **Disparo para o CRM** + Rastreamento de UTMs e Analytics
5. **Redirecionamento automático para o WhatsApp** de Rogério Gardiano com mensagem pré-preenchida

---

## 🚀 Como Testar Localmente

### Teste de Aparição do CTA
Por padrão, o CTA aparece após 3 minutos (180.000ms). Para testar a aparição do CTA **instantaneamente** durante o desenvolvimento, abra a página com a query string:

```text
index.html?preview_cta=true
```
ou
```text
index.html?cta=now
```

### Configurações Globais (`js/config.js`)
No arquivo `js/config.js`, você pode alterar:
- `CTA_DELAY_MS`: Tempo em milissegundos para liberação do botão.
- `WHATSAPP_NUMBER`: Número oficial do WhatsApp do Rogério.
- `CRM_ENDPOINT`: Endpoint da API / CRM para receber os leads.
- `WHATSAPP_MESSAGE_TEMPLATE`: Mensagem padrão pré-preenchida.

---

## 🎨 Sistema de Design (Regra 60-30-10)

- **60% Base**: Off-White (`#F8FAFC`) e Navy Blue Executivo (`#0A0F1D`)
- **30% Apoio**: Azul Petróleo (`#131B2E`) e Grafite (`#1E293B`)
- **10% Destaque**: Dourado/Âmbar Executivo (`#D97706` / `#F59E0B`)

---

## 📊 Rastreamento & Analytics (`js/tracking.js`)

A página captura e registra automaticamente os seguintes eventos e métricas:
- UTMs: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- Eventos: `page_view`, `vsl_loaded`, `cta_visible`, `cta_click`, `form_open`, `form_submit`, `crm_success`, `whatsapp_redirect`
- Tipo de dispositivo: Mobile, Tablet ou Desktop.
