import NavBar from './Navbar';
import { resilientFetch } from "../apiConfig";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Globe, Search, Filter, ExternalLink, CheckCircle2 } from 'lucide-react';

const FilterButton = styled(Button)(({ active }) => ({
  backgroundColor: active ? '#FF0000' : '#212121',
  border: active ? '1px solid #FF0000' : '1px solid #303030',
  color: active ? '#ffffff' : '#aaaaaa',
  padding: '6px 14px',
  margin: '3px',
  borderRadius: '18px',
  fontWeight: '700',
  fontSize: '0.82rem',
  textTransform: 'none',
  boxShadow: active ? '0 0 12px rgba(255, 0, 0, 0.45)' : 'none',
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: active ? '#cc0000' : '#2a2a2a',
    color: '#ffffff',
  },
}));

const ChannelCard = styled(Card)({
  backgroundColor: '#181818',
  border: '1px solid #272727',
  borderRadius: '12px',
  color: '#ffffff',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    borderColor: '#FF0000',
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 24px rgba(255, 0, 0, 0.15)',
  },
});

const StyledButton = styled(Button)({
  backgroundColor: '#FF0000',
  color: '#ffffff',
  borderRadius: '18px',
  fontWeight: '700',
  textTransform: 'none',
  padding: '8px 16px',
  fontSize: '0.86rem',
  '&:hover': {
    backgroundColor: '#cc0000',
  },
});

const COUNTRIES = [
  { code: "ALL", name: "Global / All", flag: "🌐" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" }
];

const CATEGORIES = [
  { id: "24", name: "Entertainment" },
  { id: "28", name: "Science & Technology" },
  { id: "20", name: "Gaming" },
  { id: "10", name: "Music" },
  { id: "27", name: "Education" },
  { id: "23", name: "Comedy" },
  { id: "22", name: "People & Blogs" },
  { id: "25", name: "News & Politics" },
  { id: "17", name: "Sports" },
  { id: "26", name: "How-to & Style" },
  { id: "1", name: "Film & Animation" },
  { id: "2", name: "Autos & Vehicles" },
  { id: "15", name: "Pets & Animals" }
];

const Recommendations = () => {
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("24");
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecommendations = async (categoryId, countryCode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await resilientFetch(`/recommendations/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          categories: [categoryId],
          country: countryCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.results && data.results.length > 0) {
          setChannels(data.results);
          setError(null);
        } else {
          setChannels([]);
          setError(`No channels found for ${COUNTRIES.find(c => c.code === countryCode)?.name || countryCode} in this category.`);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch channels');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message || 'Failed to fetch recommendations. Please try again.');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await resilientFetch(`/ping`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') {
            setBackendStatus('connected');
            setError(null);
            // Auto fetch initial recommendations
            fetchRecommendations(selectedCategory, selectedCountry);
          } else {
            setBackendStatus('error');
            setError('Backend server is not responding correctly');
          }
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        console.error('Backend connection error:', err);
        setBackendStatus('error');
        setError('Cannot connect to backend server. Make sure Flask is active on port 5000.');
      }
    };

    checkBackendStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountrySelect = (code) => {
    setSelectedCountry(code);
    if (selectedCategory) {
      fetchRecommendations(selectedCategory, code);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    fetchRecommendations(categoryId, selectedCountry);
  };

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(c => 
      c.channel_name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.country && c.country.toLowerCase().includes(q))
    );
  }, [channels, searchQuery]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (backendStatus === 'checking') {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#FF0000' }} />
        <Typography sx={{ color: '#aaaaaa' }}>
          Connecting to InsightSphere Studio Services...
        </Typography>
      </Box>
    );
  }

  if (backendStatus === 'error') {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: '#0f0f0f',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 2, background: 'rgba(255, 0, 0, 0.12)', color: '#ff4d4d', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2, backgroundColor: '#FF0000', borderRadius: '18px', '&:hover': { backgroundColor: '#cc0000' } }}
        >
          Retry Connection
        </Button>
      </Box>
    );
  }

  const activeCountryObj = COUNTRIES.find(c => c.code === selectedCountry);
  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#ffffff',
      fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      pb: 8
    }}>
      <NavBar />
      
      <Container maxWidth="xl" sx={{ pt: 3, px: { xs: 2, md: 4 } }}>
        {/* Header - YouTube Studio Layout */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          borderBottom: '1px solid #272727',
          pb: 2.5
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <span style={{
                background: '#FF0000',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Smart Recommendations
              </span>
              <span style={{ fontSize: '12px', color: '#aaaaaa' }}>Global & Regional Channel Discovery</span>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#ffffff',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                m: 0
              }}
            >
              Creator & Channel Discovery
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#aaaaaa',
                mt: 0.5
              }}
            >
              Filter top-performing YouTube channels by sovereign country and content vertical.
            </Typography>
          </Box>

          {/* Quick Search */}
          <Box sx={{ minWidth: { xs: '100%', sm: '280px' } }}>
            <TextField
              size="small"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#aaaaaa" />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  background: '#181818',
                  color: '#ffffff',
                  borderRadius: '20px',
                  '& fieldset': { borderColor: '#272727' },
                  '&:hover fieldset': { borderColor: '#3f3f3f' },
                  '&.Mui-focused fieldset': { borderColor: '#FF0000' },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.86rem',
                  py: 1
                }
              }}
            />
          </Box>
        </Box>

        {/* 1. Country-Wise Filter Bar */}
        <Box sx={{ 
          mb: 2.5, 
          background: '#181818', 
          border: '1px solid #272727', 
          borderRadius: '12px', 
          p: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Globe size={16} color="#FF0000" />
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#ffffff',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.78rem'
                }}
              >
                1. Country-Wise Filter
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
              Active Country: <strong style={{ color: '#FF0000' }}>{activeCountryObj?.flag} {activeCountryObj?.name}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {COUNTRIES.map((country) => {
              const isActive = selectedCountry === country.code;
              return (
                <FilterButton
                  key={country.code}
                  active={isActive}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <span style={{ marginRight: '6px', fontSize: '1rem' }}>{country.flag}</span>
                  <span>{country.name}</span>
                </FilterButton>
              );
            })}
          </Box>
        </Box>

        {/* 2. Category Vertical Filter Bar */}
        <Box sx={{ 
          mb: 3.5, 
          background: '#181818', 
          border: '1px solid #272727', 
          borderRadius: '12px', 
          p: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Filter size={16} color="#FF0000" />
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: '#ffffff',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.78rem'
                }}
              >
                2. Category Vertical
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
              Selected Category: <strong style={{ color: '#ffffff' }}>{activeCategoryObj?.name}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <FilterButton
                  key={category.id}
                  active={isActive}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                </FilterButton>
              );
            })}
          </Box>
        </Box>

        {/* Content Section */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" my={8} flexDirection="column" gap={2}>
            <CircularProgress sx={{ color: '#FF0000' }} />
            <Typography sx={{ color: '#aaaaaa', fontSize: '0.9rem' }}>
              Retrieving channels for {activeCountryObj?.flag} {activeCountryObj?.name} in {activeCategoryObj?.name}...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4, background: 'rgba(255, 0, 0, 0.12)', color: '#ff4d4d', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
            {error}
          </Alert>
        ) : filteredChannels.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#ffffff',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <span>Recommended Channels</span>
                <span style={{
                  background: '#272727',
                  color: '#FF0000',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {filteredChannels.length}
                </span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#aaaaaa' }}>
                Sorted by verified subscriber reach
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {filteredChannels.map((channel) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={channel.channel_id}>
                  <ChannelCard>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={channel.thumbnails?.high?.url || channel.thumbnails?.medium?.url || channel.thumbnails?.default?.url || '/default-channel.png'}
                        alt={channel.channel_name}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
                        }}
                        sx={{ objectFit: 'cover', background: '#0a0a0a' }}
                      />
                      {/* Country Flag / Tag Badge */}
                      <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(15, 15, 15, 0.88)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid #333333',
                        color: '#ffffff',
                        px: 1,
                        py: 0.3,
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{channel.country || 'Global'}</span>
                      </Box>
                    </Box>

                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.8 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#ffffff', 
                            fontWeight: '800', 
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {channel.channel_name}
                        </Typography>
                        <CheckCircle2 size={14} color="#10b981" />
                      </Box>

                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#aaaaaa',
                          mb: 2,
                          height: '2.8em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.80rem',
                          lineHeight: 1.4
                        }}
                      >
                        {channel.description || "Active YouTube creator and verified content publisher."}
                      </Typography>

                      <Stack spacing={0.8} sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #272727' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                          <span style={{ color: '#aaaaaa' }}>Subscribers</span>
                          <span style={{ color: '#ffffff', fontWeight: '700' }}>{formatNumber(channel.subscriber_count)}</span>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                          <span style={{ color: '#aaaaaa' }}>Published Videos</span>
                          <span style={{ color: '#ffffff', fontWeight: '700' }}>{formatNumber(channel.video_count)}</span>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                          <span style={{ color: '#aaaaaa' }}>Lifetime Impressions</span>
                          <span style={{ color: '#FF0000', fontWeight: '700' }}>{formatNumber(channel.view_count)}</span>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <StyledButton
                        fullWidth
                        href={channel.custom_url || (channel.channel_id?.startsWith('UC') && channel.channel_id.length === 24 ? `https://www.youtube.com/channel/${channel.channel_id}` : (channel.handle ? `https://www.youtube.com/${channel.handle}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(channel.channel_name)}`))}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<ExternalLink size={14} />}
                      >
                        Open on YouTube
                      </StyledButton>
                    </CardActions>
                  </ChannelCard>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#aaaaaa', fontSize: '1rem' }}>
              No channels found for the selected country and category. Try another filter.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Recommendations;
