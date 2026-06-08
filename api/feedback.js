import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('experimental_games_feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Calculate stats
      const totalFeedback = data.length;
      const avgRating = data.reduce((sum, f) => sum + (f.rating || 0), 0) / (totalFeedback || 1);
      const likedCount = data.filter(f => f.liked).length;
      const likeRate = totalFeedback > 0 ? (likedCount / totalFeedback) * 100 : 0;
      
      return res.status(200).json({
        feedback: data,
        stats: {
          total: totalFeedback,
          avgRating: avgRating.toFixed(1),
          likeRate: likeRate.toFixed(1)
        }
      });
    }

    if (req.method === 'POST') {
      const { rating, liked, game_name = 'skeletal_dragon', visitor_name } = req.body;
      
      const { data, error } = await supabase
        .from('experimental_games_feedback')
        .insert({
          game_name,
          rating,
          liked,
          visitor_name: visitor_name || 'Anonim'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Check if like rate is above 85%
      const { data: allFeedback } = await supabase
        .from('experimental_games_feedback')
        .select('liked');
      
      const totalCount = allFeedback?.length || 0;
      const likedTotal = allFeedback?.filter(f => f.liked).length || 0;
      const currentRate = totalCount > 0 ? (likedTotal / totalCount) * 100 : 0;
      
      let notification = null;
      if (currentRate >= 85 && totalCount >= 5) {
        notification = {
          message: `Kurucu, İskelet Ejderha simülasyonu ziyaretçiler tarafından çok sevildi (%${currentRate.toFixed(0)} beğeni). Projeyi kalıcı olarak 'Oyunlar' kategorisine taşımak ister misiniz?`,
          likeRate: currentRate.toFixed(1),
          totalVotes: totalCount
        };
      }
      
      return res.status(201).json({
        ...data,
        notification
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Feedback API error:', err);
    res.status(500).json({ error: err.message });
  }
}