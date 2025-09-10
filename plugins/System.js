const os = require("os");
const { cmd } = require("../command");

cmd(
  {
    pattern: "system",
    desc: "Show system information",
    category: "info",
    filename: __filename,
  },
  async (client, m, { react, edit }) => {
    await react("⚙️");

    // Step-by-step progress updates
    const progressFrames = [
      "[□□□□□□□□□□] 0%",
      "[■■□□□□□□□□] 20%",
      "[■■■■□□□□□□] 40%",
      "[■■■■■■□□□□] 60%",
      "[■■■■■■■■□□] 80%",
      "[■■■■■■■■■■] 100%",
    ];

    for (let i = 0; i < progressFrames.length; i++) {
      await edit(`*SYSTEM INFO LOAD වෙමින්...*\n${progressFrames[i]}`);
      await new Promise((res) => setTimeout(res, 300)); // 300ms delay between steps
    }

    // Get system details after progress
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedMem = (totalMem - freeMem).toFixed(2);

    const cpuModel = os.cpus()[0].model;
    const cpuCores = os.cpus().length;
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const uptime = (os.uptime() / 60).toFixed(0);

    const systemInfo = `
╭━━━〔 *SYSTEM INFO* 〕━━━╮
┃🖥️ *OS:* ${platform} (${arch})
┃💻 *Host:* ${hostname}
┃🧠 *CPU:* ${cpuModel}
┃🔢 *Cores:* ${cpuCores}
┃💾 *Total RAM:* ${totalMem} GB
┃📦 *Used RAM:* ${usedMem} GB
┃🕒 *System Uptime:* ${uptime} mins
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    await edit(systemInfo);
  }
);
