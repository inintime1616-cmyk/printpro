import { Project, DateStatus } from './types';

export const getDiffDays = (deadline: string): number => {
  if (!deadline) return 999;
  const now = new Date();
  const target = new Date(deadline);
  // Reset time part to ensure accurate day calculation
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDeadlineStatus = (deadline: string): DateStatus => {
  const diff = getDiffDays(deadline);
  
  if (diff < 0) {
    return { 
      text: '已逾期', 
      colorClass: 'bg-stone-100 text-stone-500 border-stone-200 line-through', // Muted for passed
      isUrgent: true,
      isOverdue: true
    };
  }
  if (diff <= 3) {
    return { 
      text: `急迫 (${diff}天)`, 
      colorClass: 'bg-red-50 text-red-700 border-red-200 font-medium',
      isUrgent: true,
      isOverdue: false
    };
  }
  if (diff <= 7) {
    return { 
      text: `留意 (${diff}天)`, 
      colorClass: 'bg-orange-50 text-orange-700 border-orange-200',
      isUrgent: false,
      isOverdue: false
    };
  }
  return { 
    text: `正常 (${diff}天)`, 
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isUrgent: false,
    isOverdue: false
  };
};

export const getProjectStatus = (project: Project): '未規劃' | '已完成' | '進行中' | '未開始' => {
  if (!project.stages || project.stages.length === 0) return '未規劃';
  const allCompleted = project.stages.every(s => s.completed);
  if (allCompleted) return '已完成';
  const anyStarted = project.stages.some(s => s.completed);
  return anyStarted ? '進行中' : '未開始';
};

export const getCurrentStageName = (project: Project): string => {
  if (getProjectStatus(project) === '已完成') return '已完成';
  if (!project.stages || project.stages.length === 0) return '無階段';
  const stage = project.stages.find(s => !s.completed);
  return stage ? stage.name : '未知';
};

// Expanded Japanese Traditional Color Palette for Tags (Unique Colors)
const TAG_PALETTE = [
  // Reds / Pinks
  'bg-[#fdeff2] text-[#5e3023] border-[#e9cbd1]', // Sakura-iro
  'bg-[#f0908d] text-[#592a29] border-[#d67b78]', // Toki-garacha
  'bg-[#e2bab1] text-[#5e3023] border-[#d4a095]', // Araigaki
  'bg-[#eebbcb] text-[#752b42] border-[#d9a3b3]', // Nadeshiko
  'bg-[#eaacbf] text-[#6b2c45] border-[#d191a6]', // Cosmos
  'bg-[#f5c9c9] text-[#7a2e2e] border-[#e0b0b0]', // Momo
  'bg-[#f4d5d3] text-[#5c2d2d] border-[#d9b2b0]', // Ikkon-zome
  'bg-[#d7cfd1] text-[#523f42] border-[#c2b6b9]', // Umenezu

  // Oranges / Yellows / Beiges
  'bg-[#f8e4c1] text-[#6b5636] border-[#e0cdaa]', // Anzu
  'bg-[#fcd575] text-[#665229] border-[#e0be63]', // Yamabuki
  'bg-[#f0e68c] text-[#59502a] border-[#e0d676]', // Karashi
  'bg-[#fffacd] text-[#6b654b] border-[#e6e1b3]', // Kuchinashi
  'bg-[#f5deb3] text-[#5e4b35] border-[#dcc59a]', // Komugi
  'bg-[#e8d3c7] text-[#5c4636] border-[#d6bdae]', // Kitsune
  'bg-[#d8c6bc] text-[#594639] border-[#c2aca0]', // Sunairo
  'bg-[#cbbcb5] text-[#54433a] border-[#b5a39b]', // Rikyu-nezumi
  'bg-[#ebd8a0] text-[#61532a] border-[#d6c48c]', // Kuchiba
  'bg-[#e6d2ba] text-[#5c4a35] border-[#d1baa0]', // Kayoha
  
  // Greens
  'bg-[#d4dcd6] text-[#4a5950] border-[#b8c7bb]', // Byakuroku
  'bg-[#c6e0d3] text-[#2d523e] border-[#add1be]', // Seiji
  'bg-[#bad3cf] text-[#2f4f4f] border-[#9fc1bc]', // Kamenozoki
  'bg-[#b8d4b8] text-[#365236] border-[#a1bda1]', // Yanagi
  'bg-[#cde6c7] text-[#42593d] border-[#b6cfb0]', // Wakakusa
  'bg-[#a8c97f] text-[#3b4d29] border-[#8fb068]', // Moegi
  'bg-[#9ec2b1] text-[#234535] border-[#86ab99]', // Chitose
  'bg-[#98fb98] text-[#2e5e2e] border-[#81e681]', // Wakaba
  'bg-[#edf7e3] text-[#415234] border-[#d1e0c4]', // Ura-yanagi
  'bg-[#88a892] text-[#223629] border-[#72917c]', // Aotake

  // Blues
  'bg-[#b2cbe4] text-[#2c405a] border-[#94b1cf]', // Wasurenagusa
  'bg-[#a3c9db] text-[#284f61] border-[#8bb1c4]', // Mizu
  'bg-[#b0c4de] text-[#2e405e] border-[#98acd1]', // Usu-hanada
  'bg-[#ccd1e0] text-[#3d4252] border-[#b3b8c7]', // Fuji-nezumi
  'bg-[#9cafcf] text-[#293c5c] border-[#8396b5]', // Kon-nezu
  'bg-[#e0ffff] text-[#2f4f4f] border-[#c1e0e0]', // Light Cyan
  'bg-[#87ceeb] text-[#2b4f63] border-[#72b5d1]', // Sora
  'bg-[#a0d8ef] text-[#2a5463] border-[#8bc0d6]', // Ramune
  'bg-[#5a7d9a] text-[#ebf6fc] border-[#486680]', // Kachi (Darker accent)

  // Purples
  'bg-[#e6cde3] text-[#5e385a] border-[#d1b3ce]', // Fuji
  'bg-[#dcc2d6] text-[#5c3a55] border-[#c4a9be]', // Ayame
  'bg-[#cfb8c9] text-[#52384c] border-[#b8a1b2]', // Hagi
  'bg-[#e6e6fa] text-[#4b4b6e] border-[#d1d1eb]', // Lavender
  'bg-[#dda0dd] text-[#573057] border-[#c48cc4]', // Kobai
  'bg-[#d3a4ff] text-[#4b2c6b] border-[#bd8ce6]', // Sumire
  
  // Greys & Others
  'bg-[#dcdcdc] text-[#4f4f4f] border-[#c2c2c2]', // Gin-nezumi
  'bg-[#e0dacc] text-[#5e5746] border-[#c7c0b1]', // Shiracha
  'bg-[#c8c2be] text-[#4d4845] border-[#b3ada9]', // Subako
];

export const getTagColorClass = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
};