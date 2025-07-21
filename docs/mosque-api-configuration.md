# Mosque API Configuration Guide

## Overview

The mosque finder functionality supports three data sources in order of priority:

1. **Google Places API** - Most comprehensive and accurate
2. **OpenStreetMap Overpass API** - Free alternative with good coverage
3. **Enhanced Mock Data** - Fallback for development and testing

## Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Configuration
# Set to 'true' to use real mosque APIs instead of mock data
VITE_USE_REAL_MOSQUE_API=false

# Google Places API Key (optional - for real mosque data)
# Get your API key from: https://developers.google.com/maps/documentation/places/web-service/get-api-key
# Make sure to enable Places API (New) and restrict the key to your domain
VITE_GOOGLE_PLACES_API_KEY=
```

### Setting Up Google Places API

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Places API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API (New)"
   - Click "Enable"

3. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

4. **Secure Your API Key**
   - Click on your API key to configure it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain(s) (e.g., `localhost:3000`, `yourdomain.com`)
   - Under "API restrictions", select "Restrict key" and choose "Places API (New)"

5. **Add to Environment**
   ```env
   VITE_USE_REAL_MOSQUE_API=true
   VITE_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

### Production Configuration

For production deployment, set the environment variables in your hosting platform:

**Netlify:**
```
Site settings > Environment variables
VITE_USE_REAL_MOSQUE_API=true
VITE_GOOGLE_PLACES_API_KEY=your_key
```

**Vercel:**
```
Project settings > Environment Variables
VITE_USE_REAL_MOSQUE_API=true
VITE_GOOGLE_PLACES_API_KEY=your_key
```

**Other platforms:** Refer to your hosting provider's documentation for setting environment variables.

## Data Sources

### 1. Google Places API
- **Pros:** Most accurate and comprehensive data, includes ratings, photos, opening hours
- **Cons:** Requires API key, has usage limits and costs
- **Best for:** Production apps with budget for API calls

### 2. OpenStreetMap Overpass API
- **Pros:** Free, no API key required, good global coverage
- **Cons:** Data quality varies by region, slower response times
- **Best for:** Budget-conscious apps, regions with good OSM coverage

### 3. Mock Data
- **Pros:** Always available, fast response, predictable for testing
- **Cons:** Limited to predefined locations (NYC, London, Dubai, Toronto, Jakarta)
- **Best for:** Development, testing, demos

## API Usage and Costs

### Google Places API Pricing
- **Nearby Search:** $32 per 1,000 requests
- **Text Search:** $32 per 1,000 requests
- **Place Details:** $17 per 1,000 requests
- **Free tier:** $200 credit per month (about 6,250 basic searches)

### OpenStreetMap Overpass API
- **Free** but please respect usage limits
- Consider [donating](https://supporting.openstreetmap.org/) if using heavily

## Testing

To test the mosque finder:

1. **With Mock Data (default):**
   ```env
   VITE_USE_REAL_MOSQUE_API=false
   ```
   - Set location to New York, London, Dubai, Toronto, or Jakarta
   - Should show relevant mosques from mock data

2. **With Real APIs:**
   ```env
   VITE_USE_REAL_MOSQUE_API=true
   VITE_GOOGLE_PLACES_API_KEY=your_key
   ```
   - Use any location
   - Should show real mosques from Google Places or OpenStreetMap

## Troubleshooting

### Common Issues

1. **No mosques found**
   - Check if location services are working
   - Verify the search radius (try increasing it)
   - Ensure you're in an area with mosques

2. **API key errors**
   - Verify the API key is correct
   - Check that Places API (New) is enabled
   - Ensure your domain is in the referrer restrictions

3. **CORS errors**
   - This shouldn't happen with properly configured APIs
   - If using a proxy, ensure it's configured correctly

### Debug Mode

You can check the browser console for detailed error messages and fallback behavior:

```javascript
// The service will log which data source is being used
console.log('Trying Google Places API...')
console.log('Google Places failed, trying OpenStreetMap...')
console.log('OpenStreetMap failed, using mock data...')
```

## Development vs Production

### Development
- Use mock data for fast iteration
- Set `VITE_USE_REAL_MOSQUE_API=false`

### Staging/Testing
- Use OpenStreetMap for free real data testing
- Set `VITE_USE_REAL_MOSQUE_API=true` without Google API key

### Production
- Use Google Places API for best user experience
- Set both environment variables with a valid API key
- Monitor usage and costs in Google Cloud Console 