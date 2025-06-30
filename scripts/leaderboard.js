export class Leaderboard {
  constructor(supabase) {
    this.supabase = supabase;

    this.pointsTableBody = document.getElementById('pointLeaderboardBody');
    this.pointsSection = document.getElementById('pointLeaderboardTable');
    this.refreshCountdownEl = document.getElementById('refreshCountdown');

    this.loadAll();
  }

  async loadAll() {
    await this.loadPoints();
    this.showPoints();
  }

  async loadPoints() {
    const { data, error } = await this.supabase
      .from('users')
      .select('username, total_points, created_at')
      .gt('total_points', 0)
      .order('total_points', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading points leaderboard:', error);
      this.pointsTableBody.innerHTML = `<tr><td colspan="4">Failed to load data</td></tr>`;
      return;
    }

    this.renderPoints(data);
  }

  renderPoints(data) {
    this.pointsTableBody.innerHTML = '';
    if (!data.length) {
      this.pointsTableBody.innerHTML = `<tr><td colspan="4">No data</td></tr>`;
      return;
    }
    data.forEach((u, i) => {
      this.pointsTableBody.insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td>${u.username}</td>
          <td>${u.total_points}</td>
        </tr>
      `);
    });
  }

  showPoints() {
    this.pointsSection.classList.remove('d-none');
  }
}