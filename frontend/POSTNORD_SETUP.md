# PostNord Booking API (test) setup

This file documents how to test PostNord Booking API integration in your environment. By default the code targets the PostNord test/sandbox base URL, but it supports calling the real (production) PostNord API if you explicitly allow it.

Environment
- Set `POSTNORD_API_KEY` in your `frontend/.env` to your PostNord API key (sandbox or production key). If you need to override the base URL, set `POSTNORD_BASE_URL`.
- Safety: to prevent accidental live calls, the server will refuse to call PostNord production unless you set `POSTNORD_ALLOW_LIVE=true` in the environment. You can also set `POSTNORD_ENV=production` to mark environment as production.

Endpoints added
- `POST /api/postnord/booking` - creates a booking. Accepts a JSON body matching PostNord's booking payload.
- `GET /api/postnord/labels?bookingId=...` - downloads the booking label PDF as base64 in `pdfBase64`.

Example booking payload (simplified)

{
  "customerReference": "ORDER-1234",
  "shipments": [
    {
      "shipmentId": "1",
      "product": "SE.PARCEL",
      "sender": {
        "name": "My Shop AB",
        "address1": "Shop Street 1",
        "postalCode": "12345",
        "city": "Stockholm",
        "country": "SE",
        "email": "shop@example.com",
        "phone": "+46123456789"
      },
      "recipient": {
        "name": "Customer Name",
        "address1": "Customer Street 2",
        "postalCode": "11122",
        "city": "Stockholm",
        "country": "SE",
        "email": "customer@example.com",
        "phone": "+46701234567"
      }
    }
  ]
}

Notes on QR codes / labels
- PostNord's label generation normally supports different label types and return label options. To include return labels or QR codes, include appropriate options in the booking payload such as `returnInfo` and `label` options depending on PostNord's API version. Consult PostNord sandbox docs for exact fields.

Testing
- Start your Nuxt dev server, ensure `frontend/.env` contains `POSTNORD_API_KEY`.
- If you intend to call the real PostNord production API, set `POSTNORD_ALLOW_LIVE=true` in `frontend/.env`. Without this flag, any attempt to call production will return a blocked message.

PowerShell (Windows) examples

Create booking (example):

```powershell
$body = @{
  customerReference = 'ORDER-1234'
  shipments = @(@{
    shipmentId = '1'
    product = 'SE.PARCEL'
    sender = @{ name = 'My Shop AB'; address1 = 'Shop Street 1'; postalCode = '12345'; city = 'Stockholm'; country = 'SE' }
    recipient = @{ name = 'Customer Name'; address1 = 'Customer Street 2'; postalCode = '11122'; city = 'Stockholm'; country = 'SE' }
  })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/postnord/booking' -Body $body -ContentType 'application/json'
```

Get label (base64 PDF):

```powershell
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/postnord/labels?bookingId=THE_BOOKING_ID'
```

Converting returned base64 to a file in PowerShell (example):

```powershell
#$base64 = '<the pdfBase64 string here>'
[IO.File]::WriteAllBytes('label.pdf', [Convert]::FromBase64String($base64))
```
