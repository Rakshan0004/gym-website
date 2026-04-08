const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const tables = ['daily_metrics', 'item_completions', 'exercise_completions'];
  const health = {};

  try {
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true }).limit(1);
      health[table] = error ? `Error: ${error.message}` : 'Healthy';
    }
    res.status(200).json({ status: 'OK', health });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
