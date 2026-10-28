import { Request, Response } from 'express';
import { db } from '../database/db';
import { binService } from '../services/binService';
import { AnalyticsSummary, Bin } from '../models/types';

export async function handleGetAnalyticsSummary(req: Request, res: Response): Promise<void> {
  try {
    const bins = await binService.getEnrichedBins();

    let online = 0;
    let warning = 0;
    let offline = 0;

    let full = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    let realCount = 0;
    let demoCount = 0;

    let totalFillSum = 0;

    const wardMap = new Map<string, { total: number; fillSum: number; critical: number }>();

    bins.forEach((bin) => {
      // Connection state
      if (bin.connection_state === 'ONLINE') online++;
      else if (bin.connection_state === 'WARNING') warning++;
      else offline++;

      // Status level
      if (bin.current_status === 'FULL') full++;
      else if (bin.current_status === 'HIGH') high++;
      else if (bin.current_status === 'MEDIUM') medium++;
      else low++;

      // Data source
      if (bin.data_source === 'REAL') realCount++;
      else demoCount++;

      totalFillSum += bin.current_fill_percent;

      // Ward grouping
      const currentWard = wardMap.get(bin.ward) || { total: 0, fillSum: 0, critical: 0 };
      currentWard.total++;
      currentWard.fillSum += bin.current_fill_percent;
      if (bin.current_status === 'FULL' || bin.current_status === 'HIGH') {
        currentWard.critical++;
      }
      wardMap.set(bin.ward, currentWard);
    });

    const averageFill = bins.length > 0 ? Number((totalFillSum / bins.length).toFixed(1)) : 0;

    const wardStats = Array.from(wardMap.entries()).map(([ward, data]) => ({
      ward,
      total: data.total,
      averageFill: Number((data.fillSum / data.total).toFixed(1)),
      criticalCount: data.critical,
    })).sort((a, b) => b.averageFill - a.averageFill);

    // Build 24-hour hourly trend estimates
    const hourlyTrends = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const hourStr = `${d.getHours().toString().padStart(2, '0')}:00`;
      // Realistic municipal curve: dips overnight (02:00-06:00), peaks afternoon/evening (14:00-20:00)
      const baseVariation = Math.sin((d.getHours() - 6) / 24 * Math.PI * 2) * 15;
      const hourlyAvg = Math.max(30, Math.min(85, Math.round(averageFill + baseVariation)));
      hourlyTrends.push({
        hour: hourStr,
        averageFill: hourlyAvg,
        telemetryCount: 65 + (i % 15),
      });
    }

    // Top full bins
    const topFullBins = [...bins]
      .sort((a, b) => b.current_fill_percent - a.current_fill_percent)
      .slice(0, 10);

    const summary: AnalyticsSummary = {
      totalDustbins: bins.length,
      online,
      warning,
      offline,
      statusCounts: { full, high, medium, low },
      dataSourceCounts: { real: realCount, demo: demoCount },
      averageFill,
      wardStats,
      hourlyTrends,
      topFullBins,
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: any) {
    console.error('[CONTROLLER ERROR] handleGetAnalyticsSummary:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate analytics summary' });
  }
}
