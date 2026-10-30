const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const { setupAdmin, adminCommands } = require("./admin");

// ======================================================
// CONFIG
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const PREFIX = ".";
const DATA_FILE = "./data.json";

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

// ======================================================
// COLORES
// ======================================================

const COLORS = {
  primary: "#7C8CFF",
  success: "#57F287",
  error: "#ED4245",
  warning: "#FEE75C",
  economy: "#63E6BE",
  level: "#C084FC",
  info: "#60A5FA",
  admin: "#A78BFA",
  royale: "#F5B7FF"
};

// ======================================================
// SIMBOLOS
// ======================================================

const E = {
  money: "$",
  bank: "▱",
  gain: "＋",
  loss: "−",
  transfer: "⇄",
  inventory: "◇",
  level: "✦",
  time: "◷",
  warning: "⚠",
  error: "×",
  success: "✓",
  info: "◉",
  admin: "⚙",
  logs: "⌁",
  arrow: "›",
  user: "○",
  shop: "▦",
  random: "◆",
  royale: "✧"
};

// ======================================================
// TEMPLATES
// ======================================================

const WELCOME_TEMPLATE = `👋・¡Bienvenido/a a LRM Studio!

¡Hey, $(user.mention)! Nos alegra tenerte por aquí. 💫

Esperamos que disfrutes tu estancia, conozcas gente nueva y formes parte de nuestra comunidad.

📌 Para comenzar:

📜 Lee las reglas del servidor.
🔔 Revisa nuestros anuncios y novedades.
🎭 Consigue tus roles.
💬 ¡Preséntate y comienza a hablar con la comunidad!

✨ Ya somos $(server.member_count) miembros en LRM Studio.

¡Gracias por unirte y esperamos que la pases genial! ❤️

— LRM Studio`;

const INVITE_TEMPLATE = `🔗・Sistema de Invitaciones

¡Gracias por ayudar a crecer a LRM Studio! 💫

Invita a tus amigos y ayuda a que nuestra comunidad llegue cada vez a más personas.

👤 Invitado por: $(inviter.mention)
📨 Invitaciones: $(inviter.invites)
👥 Miembros: $(server.member_count)

⭐ Cada invitación cuenta. Comparte nuestro servidor con personas que puedan estar interesadas en formar parte de nuestra comunidad.

¡Gracias por apoyar a la comunidad! ❤️
— LRM Studio`;

const LEVEL_TEMPLATE = `🎉・¡Subiste de Nivel!

¡Felicidades $(user.mention)! ✨

🏆 Nivel: $(level)
⭐ XP: $(xp)
📊 Rank: #$(rank)

¡Sigue participando en LRM Studio! 💖`;

const ALLIANCE_TEMPLATE = `🤝・Nueva Alianza

Gracias $(invite.guild.name) por hacer alianza con LRM Studio. 💖

👤 Hecha por: $(user.mention)
🏆 Rank: #$(partner.rank)
⭐ Puntos: $(partner.points)

LRM Studio × $(invite.guild.name) 🤝`;

const AFFY_TEMPLATE = `💞・Nuevo Affy

$(user.mention) ahora es Affy de LRM Studio ✨

🤝 Servidor: $(invite.guild.name)
🏆 Rank: #$(partner.rank)
⭐ Puntos: $(partner.points)

LRM Studio × $(invite.guild.name) 💞`;

const HONEYPOT_TEMPLATE = `🍯・Honeypot

Este canal forma parte del sistema de seguridad de LRM Studio.

⚠️ No interactúes con este canal.

Cualquier interacción será detectada automáticamente y podrá activar las medidas de seguridad del servidor.

🛡️ LRM Studio Security`;

// ======================================================
// DATA
// ======================================================

const DEFAULT_DATA = {
  users: {},
  shop: {},
  settings: {
    logs: {},
    systemChannels: {}
  },
  ticketSystem: {},
  inviteSystem: {},
  partners: {},
  moderation: {},
  honeypot: {}
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DEFAULT_DATA, null, 2)
    );

    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    data.users ??= {};
    data.shop ??= {};
    data.settings ??= {};
    data.settings.logs ??= {};
    data.settings.systemChannels ??= {};
    data.ticketSystem ??= {};
    data.inviteSystem ??= {};
    data.partners ??= {};
    data.moderation ??= {};
    data.honeypot ??= {};

    return data;
  } catch (error) {
    console.error("Error cargando data.json:", error);

    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

let data = loadData();

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("Error guardando data.json:", error);
  }
}

// ======================================================
// USUARIOS
// ======================================================

function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      wallet: 0,
      bank: 0,
      inventory: [],
      xp: 0,
      level: 1,
      cooldowns: {},
      luckRoyale: {
        spins: 0,
        wins2: 0,
        wins3: 0
      }
    };

    saveData();
  }

  const user = data.users[id];

  user.wallet ??= 0;
  user.bank ??= 0;
  user.inventory ??= [];
  user.xp ??= 0;
  user.level ??= 1;
  user.cooldowns ??= {};

  user.luckRoyale ??= {};
  user.luckRoyale.spins ??= 0;
  user.luckRoyale.wins2 ??= 0;
  user.luckRoyale.wins3 ??= 0;

  return user;
}

// ======================================================
// UTILIDADES GENERALES
// ======================================================

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function cooldown(user, key, seconds) {
  const now = Date.now();
  const last = user.cooldowns[key] || 0;

  const remaining =
    seconds * 1000 - (now - last);

  if (remaining > 0) {
    return Math.ceil(remaining / 1000);
  }

  user.cooldowns[key] = now;
  return 0;
}

function glassEmbed({
  title,
  description,
  color = COLORS.primary,
  fields = [],
  footer = true
}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description || null);

  if (fields.length) {
    embed.addFields(fields);
  }

  if (footer) {
    embed.setFooter({
      text: "LRM Studio  •  Fluent Glass"
    });
  }

  return embed;
}

function errorEmbed(description) {
  return glassEmbed({
    title: `${E.error} Error`,
    description,
    color: COLORS.error
  });
}

function successEmbed(description) {
  return glassEmbed({
    title: `${E.success} Completado`,
    description,
    color: COLORS.success
  });
}

// ======================================================
// XP / NIVELES
// ======================================================

function xpNeeded(level) {
  return level * 100;
}

function getRank(guild) {
  const members = Object.entries(data.users)
    .map(([id, user]) => ({
      id,
      xp: user.xp || 0
    }))
    .sort((a, b) => b.xp - a.xp);

  return members;
}

function addXP(userId, amount, guild) {
  const user = getUser(userId);

  user.xp += amount;

  let leveledUp = false;

  while (user.xp >= xpNeeded(user.level)) {
    user.xp -= xpNeeded(user.level);
    user.level++;
    leveledUp = true;
  }

  saveData();

  return {
    leveledUp,
    level: user.level
  };
}

// ======================================================
// LOGS
// ======================================================

async function sendLog(guild, type, embed) {
  try {
    const channelId =
      data.settings?.logs?.[guild.id]?.[type];

    if (!channelId) return;

    const channel =
      guild.channels.cache.get(channelId);

    if (!channel) return;

    await channel.send({
      embeds: [embed]
    });
  } catch (error) {
    console.error("Error enviando log:", error);
  }
}

async function logAction(
  guild,
  type,
  title,
  description,
  color = COLORS.info
) {
  await sendLog(
    guild,
    type,
    glassEmbed({
      title,
      description,
      color
    })
  );
}

// ======================================================
// INVITACIONES
// ======================================================

const inviteCache = new Map();

async function cacheInvites(guild) {
  try {
    const invites = await guild.invites.fetch();

    const map = new Map();

    invites.forEach(invite => {
      map.set(
        invite.code,
        invite.uses || 0
      );
    });

    inviteCache.set(guild.id, map);
  } catch (error) {
    console.error(
      `No se pudieron cargar invitaciones de ${guild.name}:`,
      error.message
    );
  }
}

function getInviteChanges(oldMap, newInvites) {
  const changes = [];

  for (const invite of newInvites.values()) {
    const oldUses =
      oldMap?.get(invite.code) || 0;

    const newUses =
      invite.uses || 0;

    if (newUses > oldUses) {
      changes.push({
        invite,
        uses: newUses - oldUses
      });
    }
  }

  return changes;
}

// ======================================================
// RANK DE PARTNERS
// ======================================================

function getPartnerRank(guildId, points) {
  const partners =
    data.partners[guildId] || {};

  const list = Object.entries(
    partners
  )
    .map(([id, partner]) => ({
      id,
      points: partner.points || 0
    }))
    .sort((a, b) => b.points - a.points);

  const index =
    list.findIndex(
      x => x.points <= points
    );

  return index === -1
    ? list.length + 1
    : index + 1;
}

// ======================================================
// LUCK ROYALE
// ======================================================

const ROYALE_POOL = [
  "🍒",
  "💎",
  "⭐",
  "🍀",
  "🔥",
  "💜",
  "🌟",
  "👑"
];

async function startLuckRoyale(interaction) {
  const user = getUser(interaction.user.id);

  const cd = cooldown(
    user,
    "luckroyale",
    30
  );

  if (cd) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          `${E.time} Debes esperar **${cd}s** antes de volver a usar Luck Royale.`
        )
      ],
      ephemeral: true
    });
  }

  const accept = new ButtonBuilder()
    .setCustomId("luck_accept")
    .setLabel("Aceptar")
    .setStyle(ButtonStyle.Success);

  const reject = new ButtonBuilder()
    .setCustomId("luck_reject")
    .setLabel("Rechazar")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
    .addComponents(
      accept,
      reject
    );

  await interaction.reply({
    embeds: [
      glassEmbed({
        title: `${E.royale} Luck Royale`,
        description:
          "🎰 Vas a iniciar una ronda de Luck Royale.\n\n" +
          "💡 **No cuesta Coins Nisk.**\n" +
          "🎁 Puedes conseguir premios de Royale.\n\n" +
          "¿Quieres continuar?",
        color: COLORS.royale
      })
    ],
    components: [row]
  });
}

async function runLuckRoyale(interaction) {
  const user = getUser(
    interaction.user.id
  );

  user.luckRoyale.spins++;

  const message = await interaction.message;

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId("luck_running")
        .setLabel("Girando...")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

  await interaction.update({
    embeds: [
      glassEmbed({
        title: `${E.royale} Luck Royale`,
        description:
          "✨ La ruleta está girando...",
        color: COLORS.royale
      })
    ],
    components: [row]
  });

  for (let i = 0; i < 8; i++) {
    const emojis = [
      ROYALE_POOL[random(0, ROYALE_POOL.length - 1)],
      ROYALE_POOL[random(0, ROYALE_POOL.length - 1)],
      ROYALE_POOL[random(0, ROYALE_POOL.length - 1)]
    ];

    await new Promise(resolve =>
      setTimeout(resolve, 500)
    );

    await message.edit({
      embeds: [
        glassEmbed({
          title: `${E.royale} Luck Royale`,
          description:
            `🎰 **${emojis.join("  |  ")}**`,
          color: COLORS.royale
        })
      ],
      components: [row]
    });
  }

  const final = [
    ROYALE_POOL[random(0, ROYALE_POOL.length - 1)],
    ROYALE_POOL[random(0, ROYALE_POOL.length - 1)],
    ROYALE_POOL[random(0, ROYALE_POOL.length - 1)]
  ];

  const [a, b, c] = final;

  let result;
  let reward = null;
  let xp = 3;

  if (a === b && b === c) {
    user.inventory.push(
      `Premio Royale ${a}`
    );

    user.luckRoyale.wins3++;
    xp = 15;

    result =
      `👑 **TRIPLE ROYALE**\n\n` +
      `🎁 Premio: \`Premio Royale ${a}\``;
  } else if (
    a === b ||
    a === c ||
    b === c
  ) {
    user.inventory.push(
      "Ficha Royale"
    );

    user.luckRoyale.wins2++;
    xp = 8;

    result =
      `✨ **DOBLE ROYALE**\n\n` +
      `🎁 Premio: \`Ficha Royale\``;
  } else {
    result =
      "🌙 No hubo combinación esta vez.\n\n" +
      "⭐ Ganaste experiencia por participar.";
  }

  addXP(
    interaction.user.id,
    xp,
    interaction.guild
  );

  saveData();

  await message.edit({
    embeds: [
      glassEmbed({
        title: `${E.royale} Resultado Royale`,
        description:
          `🎰 **${final.join("  |  ")}**\n\n` +
          result +
          `\n\n⭐ XP ganada: **${xp}**`,
        color: COLORS.royale
      })
    ],
    components: []
  });
}

// ======================================================
// COMANDOS DE USUARIO
// ======================================================

const userCommands = [

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra la ayuda de LRM Studio"),

  new SlashCommandBuilder()
    .setName("utilidades")
    .setDescription("Abre el menú de utilidades"),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Muestra tu dinero"),

  new SlashCommandBuilder()
    .setName("work")
    .setDescription("Trabaja y gana Coins Nisk"),

  new SlashCommandBuilder()
    .setName("risk")
    .setDescription("Arriesga dinero"),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Comete un crimen"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Recoge tu recompensa diaria"),

  new SlashCommandBuilder()
    .setName("dep")
    .setDescription("Deposita dinero en el banco")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad a depositar")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("with")
    .setDescription("Retira dinero del banco")
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad a retirar")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Paga a otro usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Muestra tu perfil"),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Muestra tu inventario"),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Muestra tu ranking"),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Muestra la tienda"),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Compra un artículo")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Artículo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription("Usa un artículo")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Artículo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("baltop")
    .setDescription("Ranking de dinero"),

  new SlashCommandBuilder()
    .setName("leveltop")
    .setDescription("Ranking de niveles"),

  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Lanza una moneda"),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Pregunta a la bola 8")
    .addStringOption(option =>
      option
        .setName("pregunta")
        .setDescription("Tu pregunta")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("random")
    .setDescription("Genera un número aleatorio")
    .addIntegerOption(option =>
      option
        .setName("min")
        .setDescription("Mínimo")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("max")
        .setDescription("Máximo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Lanza un dado"),

  new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Elige entre opciones")
    .addStringOption(option =>
      option
        .setName("opciones")
        .setDescription("Opciones separadas por comas")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Piedra, papel o tijera")
    .addStringOption(option =>
      option
        .setName("opcion")
        .setDescription("Tu elección")
        .setRequired(true)
        .addChoices(
          {
            name: "Piedra",
            value: "piedra"
          },
          {
            name: "Papel",
            value: "papel"
          },
          {
            name: "Tijera",
            value: "tijera"
          }
        )
    ),

  new SlashCommandBuilder()
    .setName("luckroyale")
    .setDescription("Juega Luck Royale"),

  new SlashCommandBuilder()
    .setName("invitever")
    .setDescription("Muestra tus invitaciones"),

  new SlashCommandBuilder()
    .setName("sugerencia")
    .setDescription("Envía una sugerencia")
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Tu sugerencia")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Muestra el ping del bot"),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Información del bot"),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Información del servidor"),

  new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Muestra los miembros"),

  new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Muestra el tiempo activo"),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Muestra información de un usuario")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Muestra el avatar")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    )
];

// ======================================================
// REGISTRO DE COMANDOS
// ======================================================

const allCommands = [
  ...userCommands,
  ...adminCommands
];

const commands = allCommands.map(command => {
  if (
    command &&
    typeof command.toJSON === "function"
  ) {
    return command.toJSON();
  }

  return command;
});

// ======================================================
// DEPENDENCIAS DEL ADMIN
// ======================================================

setupAdmin({
  client,
  data,
  saveData,
  sendLog,
  logAction,
  getUser,
  prefix: PREFIX,
  colors: COLORS,
  symbols: E
});

// ======================================================
// PARTE 1 TERMINA AQUÍ
// ======================================================
// ======================================================
// UTILIDADES
// ======================================================

function utilitiesEmbed() {
  return glassEmbed({
    title: "🛠️ Utilidades",
    description:
      "Selecciona una utilidad del menú para usarla.\n\n" +
      "Estas herramientas están disponibles para todos los miembros.",
    color: COLORS.info,
    fields: [
      {
        name: "📊 Información",
        value:
          "🏓 Ping\n" +
          "🤖 Bot Info\n" +
          "🖥️ Server Info\n" +
          "👥 Miembros\n" +
          "⏱️ Uptime",
        inline: true
      },
      {
        name: "👤 Usuario",
        value:
          "👤 User Info\n" +
          "🖼️ Avatar\n" +
          "📨 Invitaciones",
        inline: true
      },
      {
        name: "🎮 Diversión",
        value:
          "🎲 Random\n" +
          "🎲 Dado\n" +
          "🎯 Choose\n" +
          "✊ Piedra Papel Tijera\n" +
          "🔮 8Ball",
        inline: false
      }
    ]
  });
}

function utilitiesMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("lrm_utilities_menu")
      .setPlaceholder("Selecciona una utilidad...")
      .addOptions([
        {
          label: "Ping",
          description: "Muestra la latencia del bot",
          value: "ping",
          emoji: "🏓"
        },
        {
          label: "Bot Info",
          description: "Información de LRM Studio",
          value: "botinfo",
          emoji: "🤖"
        },
        {
          label: "Server Info",
          description: "Información del servidor",
          value: "serverinfo",
          emoji: "🖥️"
        },
        {
          label: "Miembros",
          description: "Muestra la cantidad de miembros",
          value: "membercount",
          emoji: "👥"
        },
        {
          label: "Uptime",
          description: "Tiempo que lleva activo el bot",
          value: "uptime",
          emoji: "⏱️"
        },
        {
          label: "User Info",
          description: "Información sobre vos",
          value: "userinfo",
          emoji: "👤"
        },
        {
          label: "Avatar",
          description: "Muestra tu avatar",
          value: "avatar",
          emoji: "🖼️"
        },
        {
          label: "Invitaciones",
          description: "Muestra tus invitaciones",
          value: "invitever",
          emoji: "📨"
        },
        {
          label: "Random",
          description: "Genera un número aleatorio",
          value: "random",
          emoji: "🎲"
        },
        {
          label: "Dado",
          description: "Lanza un dado",
          value: "dice",
          emoji: "🎲"
        },
        {
          label: "Choose",
          description: "Elige entre varias opciones",
          value: "choose",
          emoji: "🎯"
        },
        {
          label: "Piedra Papel Tijera",
          description: "Juega contra el bot",
          value: "rps",
          emoji: "✊"
        },
        {
          label: "8Ball",
          description: "Pregunta a la bola 8",
          value: "8ball",
          emoji: "🔮"
        }
      ])
  );
}

// ======================================================
// EJECUTAR COMANDOS
// ======================================================

async function executeUserCommand(interaction) {
  const command = interaction.commandName;
  const user = getUser(interaction.user.id);

  // ====================================================
  // HELP
  // ====================================================

  if (command === "help") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "📚 LRM Studio",
          description:
            "Selecciona una categoría desde el menú para consultar los comandos disponibles.",
          color: COLORS.primary,
          fields: [
            {
              name: "📚 General",
              value:
                "`/help` `/utilidades` `/ping` `/botinfo`",
              inline: false
            },
            {
              name: "🎮 Economía",
              value:
                "`/balance` `/work` `/risk` `/crime` `/daily` `/dep` `/with` `/pay`",
              inline: false
            },
            {
              name: "🏆 Perfil",
              value:
                "`/profile` `/inventory` `/rank` `/leveltop` `/baltop`",
              inline: false
            },
            {
              name: "📊 Diversión",
              value:
                "`/coinflip` `/8ball` `/random` `/dice` `/choose` `/rps` `/luckroyale`",
              inline: false
            },
            {
              name: "ℹ️ Servidor",
              value:
                "`/serverinfo` `/membercount` `/userinfo` `/avatar` `/uptime`",
              inline: false
            }
          ]
        })
      ]
    });
  }

  // ====================================================
  // UTILIDADES
  // ====================================================

  if (command === "utilidades") {
    return interaction.reply({
      embeds: [utilitiesEmbed()],
      components: [utilitiesMenu()]
    });
  }

  // ====================================================
  // BALANCE
  // ====================================================

  if (command === "balance") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.money} Balance`,
          description:
            `💰 Wallet: **${user.wallet} Coins Nisk**\n` +
            `🏦 Banco: **${user.bank} Coins Nisk**\n\n` +
            `💵 Total: **${user.wallet + user.bank} Coins Nisk**`,
          color: COLORS.economy
        })
      ]
    });
  }

  // ====================================================
  // WORK
  // ====================================================

  if (command === "work") {
    const cd = cooldown(
      user,
      "work",
      30
    );

    if (cd) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.time} Debes esperar **${cd}s** para volver a trabajar.`
          )
        ],
        ephemeral: true
      });
    }

    const amount = random(20, 30);

    user.wallet += amount;

    addXP(
      interaction.user.id,
      random(3, 8),
      interaction.guild
    );

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `💼 Trabajaste y ganaste **${amount} Coins Nisk**.\n\n` +
          `💰 Wallet: **${user.wallet}**`
        )
      ]
    });
  }

  // ====================================================
  // RISK
  // ====================================================

  if (command === "risk") {
    const cd = cooldown(
      user,
      "risk",
      60
    );

    if (cd) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.time} Debes esperar **${cd}s**.`
          )
        ],
        ephemeral: true
      });
    }

    const won = Math.random() < 0.30;

    if (won) {
      const amount = random(40, 70);

      user.wallet += amount;

      addXP(
        interaction.user.id,
        random(3, 8),
        interaction.guild
      );

      saveData();

      return interaction.reply({
        embeds: [
          successEmbed(
            `🎯 Ganaste **${amount} Coins Nisk**.\n\n` +
            `💰 Wallet: **${user.wallet}**`
          )
        ]
      });
    }

    const loss = random(50, 100);

    user.wallet -= loss;

    addXP(
      interaction.user.id,
      random(3, 8),
      interaction.guild
    );

    saveData();

    return interaction.reply({
      embeds: [
        errorEmbed(
          `💥 Perdiste **${loss} Coins Nisk**.\n\n` +
          `💰 Wallet: **${user.wallet}**`
        )
      ]
    });
  }

  // ====================================================
  // CRIME
  // ====================================================

  if (command === "crime") {
    const cd = cooldown(
      user,
      "crime",
      120
    );

    if (cd) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.time} Debes esperar **${cd}s**.`
          )
        ],
        ephemeral: true
      });
    }

    const won = Math.random() < 0.20;

    if (won) {
      const amount = random(50, 80);

      user.wallet += amount;

      addXP(
        interaction.user.id,
        random(3, 8),
        interaction.guild
      );

      saveData();

      return interaction.reply({
        embeds: [
          successEmbed(
            `🕶️ Salió bien y ganaste **${amount} Coins Nisk**.\n\n` +
            `💰 Wallet: **${user.wallet}**`
          )
        ]
      });
    }

    const loss = random(70, 200);

    user.wallet -= loss;

    addXP(
      interaction.user.id,
      random(3, 8),
      interaction.guild
    );

    saveData();

    return interaction.reply({
      embeds: [
        errorEmbed(
          `🚨 Fallaste y perdiste **${loss} Coins Nisk**.\n\n` +
          `💰 Wallet: **${user.wallet}**`
        )
      ]
    });
  }

  // ====================================================
  // DAILY
  // ====================================================

  if (command === "daily") {
    const cd = cooldown(
      user,
      "daily",
      86400
    );

    if (cd) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.time} Ya reclamaste tu recompensa. Espera **${cd}s**.`
          )
        ],
        ephemeral: true
      });
    }

    user.wallet += 50;

    addXP(
      interaction.user.id,
      random(3, 8),
      interaction.guild
    );

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `🎁 Recibiste **50 Coins Nisk** como recompensa diaria.\n\n` +
          `💰 Wallet: **${user.wallet}**`
        )
      ]
    });
  }

  // ====================================================
  // DEP
  // ====================================================

  if (command === "dep") {
    const amount =
      interaction.options.getInteger("cantidad");

    if (amount <= 0) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "La cantidad debe ser mayor que 0."
          )
        ],
        ephemeral: true
      });
    }

    if (user.wallet < amount) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero en tu wallet."
          )
        ],
        ephemeral: true
      });
    }

    user.wallet -= amount;
    user.bank += amount;

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `🏦 Depositaste **${amount} Coins Nisk**.\n\n` +
          `💰 Wallet: **${user.wallet}**\n` +
          `🏦 Banco: **${user.bank}**`
        )
      ]
    });
  }

  // ====================================================
  // WITH
  // ====================================================

  if (command === "with") {
    const amount =
      interaction.options.getInteger("cantidad");

    if (amount <= 0) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "La cantidad debe ser mayor que 0."
          )
        ],
        ephemeral: true
      });
    }

    if (user.bank < amount) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero en el banco."
          )
        ],
        ephemeral: true
      });
    }

    user.bank -= amount;
    user.wallet += amount;

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `💵 Retiraste **${amount} Coins Nisk**.\n\n` +
          `💰 Wallet: **${user.wallet}**\n` +
          `🏦 Banco: **${user.bank}**`
        )
      ]
    });
  }

  // ====================================================
  // PAY
  // ====================================================

  if (command === "pay") {
    const target =
      interaction.options.getUser("usuario");

    const amount =
      interaction.options.getInteger("cantidad");

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No puedes pagarte a vos mismo."
          )
        ],
        ephemeral: true
      });
    }

    if (amount <= 0) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "La cantidad debe ser mayor que 0."
          )
        ],
        ephemeral: true
      });
    }

    if (user.wallet < amount) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero."
          )
        ],
        ephemeral: true
      });
    }

    const receiver =
      getUser(target.id);

    user.wallet -= amount;
    receiver.wallet += amount;

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `⇄ Enviaste **${amount} Coins Nisk** a ${target}.\n\n` +
          `💰 Tu wallet: **${user.wallet}**`
        )
      ]
    });
  }

  // ====================================================
  // PROFILE
  // ====================================================

  if (command === "profile") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.user} Perfil`,
          description:
            `👤 Usuario: ${interaction.user}\n\n` +
            `💰 Coins: **${user.wallet}**\n` +
            `🏦 Banco: **${user.bank}**\n` +
            `⭐ XP: **${user.xp}**\n` +
            `✦ Nivel: **${user.level}**`,
          color: COLORS.primary
        })
      ]
    });
  }

  // ====================================================
  // INVENTORY
  // ====================================================

  if (command === "inventory") {
    const inventory =
      user.inventory.length
        ? user.inventory
            .map(
              (item, index) =>
                `**${index + 1}.** ${item}`
            )
            .join("\n")
        : "◇ Tu inventario está vacío.";

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.inventory} Inventario`,
          description: inventory,
          color: COLORS.primary
        })
      ]
    });
  }

  // ====================================================
  // RANK
  // ====================================================

  if (command === "rank") {
    const ranking =
      getRank(interaction.guild);

    const position =
      ranking.findIndex(
        x => x.id === interaction.user.id
      ) + 1;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.level} Ranking`,
          description:
            `👤 ${interaction.user}\n\n` +
            `🏆 Rank: **#${position || "?"}**\n` +
            `✦ Nivel: **${user.level}**\n` +
            `⭐ XP: **${user.xp}**`,
          color: COLORS.level
        })
      ]
    });
  }

  // ====================================================
  // SHOP
  // ====================================================

  if (command === "shop") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.shop} Tienda`,
          description:
            "🛒 Actualmente puedes consultar los artículos configurados en la tienda.",
          color: COLORS.economy
        })
      ]
    });
  }

  // ====================================================
  // COINFLIP
  // ====================================================

  if (command === "coinflip") {
    const result =
      Math.random() < 0.5
        ? "🪙 Cara"
        : "🪙 Cruz";

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🪙 Coinflip",
          description: `Resultado: **${result}**`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // 8BALL
  // ====================================================

  if (command === "8ball") {
    const answers = [
      "Sí.",
      "No.",
      "Probablemente.",
      "No estoy seguro.",
      "Definitivamente.",
      "Puede ser.",
      "Las posibilidades son altas.",
      "Mejor no contar con ello."
    ];

    const question =
      interaction.options.getString(
        "pregunta"
      );

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🔮 8Ball",
          description:
            `❓ **${question}**\n\n` +
            `🔮 ${answers[random(0, answers.length - 1)]}`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // RANDOM
  // ====================================================

  if (command === "random") {
    const min =
      interaction.options.getInteger("min");

    const max =
      interaction.options.getInteger("max");

    if (min > max) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El mínimo no puede ser mayor que el máximo."
          )
        ],
        ephemeral: true
      });
    }

    const result =
      random(min, max);

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: `${E.random} Random`,
          description:
            `🎲 Resultado: **${result}**`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // DICE
  // ====================================================

  if (command === "dice") {
    const result = random(1, 6);

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🎲 Dado",
          description:
            `Resultado: **${result}**`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // CHOOSE
  // ====================================================

  if (command === "choose") {
    const raw =
      interaction.options.getString("opciones");

    const options =
      raw
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    if (options.length < 2) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Debes colocar al menos 2 opciones separadas por comas."
          )
        ],
        ephemeral: true
      });
    }

    const choice =
      options[random(0, options.length - 1)];

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🎯 Choose",
          description:
            `La opción elegida es:\n\n` +
            `> **${choice}**`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // RPS
  // ====================================================

  if (command === "rps") {
    const player =
      interaction.options.getString("opcion");

    const choices = [
      "piedra",
      "papel",
      "tijera"
    ];

    const bot =
      choices[random(0, 2)];

    let result;

    if (player === bot) {
      result = "🤝 Empate.";
    } else if (
      (player === "piedra" && bot === "tijera") ||
      (player === "papel" && bot === "piedra") ||
      (player === "tijera" && bot === "papel")
    ) {
      result = "🏆 Ganaste.";
    } else {
      result = "💥 Gané yo.";
    }

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "✊ Piedra, Papel o Tijera",
          description:
            `👤 Tu elección: **${player}**\n` +
            `🤖 Mi elección: **${bot}**\n\n` +
            result,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // LUCK ROYALE
  // ====================================================

  if (command === "luckroyale") {
    return startLuckRoyale(interaction);
  }

  // ====================================================
  // INVITEVER
  // ====================================================

  if (command === "invitever") {
    const inviteData =
      data.inviteSystem?.[interaction.guild.id]?.[
        interaction.user.id
      ];

    const invites =
      inviteData?.invites || 0;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "📨 Invitaciones",
          description:
            `${interaction.user}\n\n` +
            `📨 Invitaciones: **${invites}**`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // SUGERENCIA
  // ====================================================

  if (command === "sugerencia") {
    const suggestion =
      interaction.options.getString("texto");

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "💡 Sugerencia",
          description:
            `${interaction.user}\n\n` +
            `> ${suggestion}`,
          color: COLORS.warning
        })
      ]
    });
  }

  // ====================================================
  // PING
  // ====================================================

  if (command === "ping") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🏓 Pong",
          description:
            `🏓 WebSocket: **${client.ws.ping}ms**`,
          color: COLORS.success
        })
      ]
    });
  }

  // ====================================================
  // BOT INFO
  // ====================================================

  if (command === "botinfo") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🤖 LRM Studio",
          description:
            "Bot oficial de LRM Studio.\n\n" +
            `🤖 Servidores: **${client.guilds.cache.size}**\n` +
            `👥 Usuarios: **${client.users.cache.size}**\n` +
            `⚙️ Discord.js: **14.x**`,
          color: COLORS.primary
        })
      ]
    });
  }

  // ====================================================
  // SERVER INFO
  // ====================================================

  if (command === "serverinfo") {
    const guild =
      interaction.guild;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🖥️ Información del servidor",
          description:
            `🏠 Nombre: **${guild.name}**\n` +
            `🆔 ID: \`${guild.id}\`\n` +
            `👑 Owner: <@${guild.ownerId}>\n` +
            `👥 Miembros: **${guild.memberCount}**\n` +
            `📅 Creado: <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // MEMBER COUNT
  // ====================================================

  if (command === "membercount") {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "👥 Miembros",
          description:
            `LRM Studio tiene actualmente **${interaction.guild.memberCount} miembros**.`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // UPTIME
  // ====================================================

  if (command === "uptime") {
    const seconds =
      Math.floor(client.uptime / 1000);

    const days =
      Math.floor(seconds / 86400);

    const hours =
      Math.floor((seconds % 86400) / 3600);

    const minutes =
      Math.floor((seconds % 3600) / 60);

    const secs =
      seconds % 60;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "⏱️ Uptime",
          description:
            `🟢 Activo durante:\n\n` +
            `**${days}d ${hours}h ${minutes}m ${secs}s**`,
          color: COLORS.success
        })
      ]
    });
  }

  // ====================================================
  // USER INFO
  // ====================================================

  if (command === "userinfo") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "👤 User Info",
          description:
            `👤 Usuario: ${target}\n` +
            `🏷️ Tag: **${target.tag}**\n` +
            `🆔 ID: \`${target.id}\`\n` +
            `🤖 Bot: **${target.bot ? "Sí" : "No"}**\n` +
            `📅 Cuenta creada: <t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
          color: COLORS.info
        })
      ]
    });
  }

  // ====================================================
  // AVATAR
  // ====================================================

  if (command === "avatar") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title: "🖼️ Avatar",
          description:
            `[Abrir avatar completo](${target.displayAvatarURL({
              size: 4096,
              extension: "png"
            })})`,
          color: COLORS.info
        }).setImage(
          target.displayAvatarURL({
            size: 1024,
            extension: "png"
          })
        )
      ]
    });
  }

  // ====================================================
  // COMANDO DESCONOCIDO
  // ====================================================

  return interaction.reply({
    embeds: [
      errorEmbed(
        "No pude encontrar ese comando."
      )
    ],
    ephemeral: true
  });
}

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // ================================================
      // BOTONES LUCK ROYALE
      // ================================================

      if (interaction.isButton()) {

        if (
          interaction.customId === "luck_reject"
        ) {
          return interaction.update({
            embeds: [
              glassEmbed({
                title: "✕ Luck Royale",
                description:
                  "Has cancelado la partida.",
                color: COLORS.error
              })
            ],
            components: []
          });
        }

        if (
          interaction.customId === "luck_accept"
        ) {
          return runLuckRoyale(
            interaction
          );
        }
      }

      // ================================================
      // MENÚ UTILIDADES
      // ================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "lrm_utilities_menu"
      ) {

        const value =
          interaction.values[0];

        if (value === "ping") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🏓 Ping",
                description:
                  `WebSocket: **${client.ws.ping}ms**`,
                color: COLORS.success
              }),
            ],
            ephemeral: true
          });
        }

        if (value === "botinfo") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🤖 Bot Info",
                description:
                  `🤖 Servidores: **${client.guilds.cache.size}**\n` +
                  `👥 Usuarios: **${client.users.cache.size}**`,
                color: COLORS.primary
              })
            ],
            ephemeral: true
          });
        }

        if (value === "serverinfo") {
          const guild =
            interaction.guild;

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🖥️ Server Info",
                description:
                  `🏠 **${guild.name}**\n` +
                  `👥 Miembros: **${guild.memberCount}**\n` +
                  `🆔 \`${guild.id}\``,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "membercount") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "👥 Miembros",
                description:
                  `Este servidor tiene **${interaction.guild.memberCount} miembros**.`,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "uptime") {
          const seconds =
            Math.floor(client.uptime / 1000);

          const days =
            Math.floor(seconds / 86400);

          const hours =
            Math.floor(
              (seconds % 86400) / 3600
            );

          const minutes =
            Math.floor(
              (seconds % 3600) / 60
            );

          const secs =
            seconds % 60;

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "⏱️ Uptime",
                description:
                  `🟢 **${days}d ${hours}h ${minutes}m ${secs}s**`,
                color: COLORS.success
              })
            ],
            ephemeral: true
          });
        }

        if (value === "userinfo") {
          const target =
            interaction.user;

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "👤 User Info",
                description:
                  `👤 ${target}\n` +
                  `🏷️ ${target.tag}\n` +
                  `🆔 \`${target.id}\`\n` +
                  `🤖 Bot: **${target.bot ? "Sí" : "No"}**`,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "avatar") {
          const avatar =
            interaction.user.displayAvatarURL({
              size: 1024,
              extension: "png"
            });

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🖼️ Avatar",
                description:
                  `[Abrir avatar completo](${avatar})`,
                color: COLORS.info
              }).setImage(avatar)
            ],
            ephemeral: true
          });
        }

        if (value === "invitever") {
          const inviteData =
            data.inviteSystem?.[
              interaction.guild.id
            ]?.[interaction.user.id];

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "📨 Invitaciones",
                description:
                  `Has realizado **${inviteData?.invites || 0} invitaciones**.`,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "random") {
          const result =
            random(1, 100);

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🎲 Random",
                description:
                  `Tu número aleatorio es **${result}**.`,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "dice") {
          const result =
            random(1, 6);

          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🎲 Dado",
                description:
                  `🎲 Sacaste un **${result}**.`,
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "choose") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🎯 Choose",
                description:
                  "Usa `/choose` y escribe las opciones separadas por comas.\n\n" +
                  "Ejemplo: `/choose opciones: Pizza, Hamburguesa, Pasta`",
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "rps") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "✊ Piedra, Papel o Tijera",
                description:
                  "Usa `/rps` para jugar contra el bot.",
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }

        if (value === "8ball") {
          return interaction.reply({
            embeds: [
              glassEmbed({
                title: "🔮 8Ball",
                description:
                  "Usa `/8ball` y escribe tu pregunta.",
                color: COLORS.info
              })
            ],
            ephemeral: true
          });
        }
      }

      // ================================================
      // SLASH COMMANDS
      // ================================================

      if (
        interaction.isChatInputCommand()
      ) {
        return executeUserCommand(
          interaction
        );
      }

    } catch (error) {

      console.error(
        "Error en interactionCreate:",
        error
      );

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        return interaction.followUp({
          embeds: [
            errorEmbed(
              "Ocurrió un error ejecutando esta interacción."
            )
          ],
          ephemeral: true
        }).catch(() => {});
      }

      return interaction.reply({
        embeds: [
          errorEmbed(
            "Ocurrió un error ejecutando esta interacción."
          )
        ],
        ephemeral: true
      }).catch(() => {});
    }
  }
);

// ======================================================
// MESSAGE CREATE
// ======================================================

client.on(
  "messageCreate",
  async message => {

    if (
      message.author.bot ||
      !message.guild
    ) {
      return;
    }

    const content =
      message.content.trim();

    // ================================================
    // PREFIX
    // ================================================

    if (
      content.startsWith(PREFIX)
    ) {
      const args =
        content
          .slice(PREFIX.length)
          .trim()
          .split(/\s+/);

      const command =
        args.shift()?.toLowerCase();

      if (command === "help") {
        return message.reply({
          embeds: [
            glassEmbed({
              title: "📚 LRM Studio",
              description:
                "Usa `/help` para ver los comandos disponibles.\n\n" +
                "También puedes usar `/utilidades` para abrir el menú de utilidades.",
              color: COLORS.primary
            })
          ]
        });
      }

      if (command === "utilidades") {
        return message.reply({
          embeds: [
            utilitiesEmbed()
          ],
          components: [
            utilitiesMenu()
          ]
        });
      }

      if (command === "balance") {
        const user =
          getUser(message.author.id);

        return message.reply({
          embeds: [
            glassEmbed({
              title: `${E.money} Balance`,
              description:
                `💰 Wallet: **${user.wallet}**\n` +
                `🏦 Banco: **${user.bank}**\n\n` +
                `💵 Total: **${user.wallet + user.bank}**`,
              color: COLORS.economy
            })
          ]
        });
      }

      if (command === "ping") {
        return message.reply({
          embeds: [
            glassEmbed({
              title: "🏓 Pong",
              description:
                `WebSocket: **${client.ws.ping}ms**`,
              color: COLORS.success
            })
          ]
        });
      }

      if (command === "luckroyale") {
        const fakeInteraction = {
          user: message.author,
          guild: message.guild,
          reply: options =>
            message.reply(options)
        };

        return startLuckRoyale(
          fakeInteraction
        );
      }
    }

    // ================================================
    // XP POR MENSAJE
    // ================================================

    const user =
      getUser(message.author.id);

    const result =
      addXP(
        message.author.id,
        random(3, 8),
        message.guild
      );

    if (result.leveledUp) {

      const ranking =
        getRank(message.guild);

      const rank =
        ranking.findIndex(
          x =>
            x.id ===
            message.author.id
        ) + 1;

      const levelMessage =
        LEVEL_TEMPLATE
          .replace(
            "$(user.mention)",
            `${message.author}`
          )
          .replace(
            "$(level)",
            String(result.level)
          )
          .replace(
            "$(xp)",
            String(user.xp)
          )
          .replace(
            "$(rank)",
            String(rank)
          );

      const channelId =
        data.settings
          ?.systemChannels
          ?.level?.[
            message.guild.id
          ];

      const channel =
        channelId
          ? message.guild.channels.cache.get(
              channelId
            )
          : message.channel;

      if (channel) {
        await channel.send({
          content: levelMessage
        }).catch(() => {});
      }
    }

    // ================================================
    // INVITACIONES / ALIANZAS / AFFYS
    // ================================================

    const inviteMatch =
      content.match(
        /https?:\/\/(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9-]+)/i
      );

    if (!inviteMatch) {
      return;
    }

    const code =
      inviteMatch[1];

    try {

      const invite =
        await client.fetchInvite(code);

      if (!invite.guild) {
        return;
      }

      const inviter =
        message.author;

      const guildId =
        message.guild.id;

      data.inviteSystem[guildId] ??= {};
      data.inviteSystem[guildId][
        inviter.id
      ] ??= {
        invites: 0
      };

      data.inviteSystem[guildId][
        inviter.id
      ].invites++;

      data.partners[guildId] ??= {};
      data.partners[guildId][
        invite.guild.id
      ] ??= {
        points: 0,
        invites: 0,
        name: invite.guild.name
      };

      data.partners[guildId][
        invite.guild.id
      ].points++;

      data.partners[guildId][
        invite.guild.id
      ].invites++;

      saveData();

      const partner =
        data.partners[guildId][
          invite.guild.id
        ];

      const rank =
        getPartnerRank(
          guildId,
          partner.points
        );

      const allianceText =
        ALLIANCE_TEMPLATE
          .replace(
            "$(invite.guild.name)",
            invite.guild.name
          )
          .replace(
            "$(user.mention)",
            `${inviter}`
          )
          .replace(
            "$(partner.rank)",
            String(rank)
          )
          .replace(
            "$(partner.points)",
            String(partner.points)
          );

      await logAction(
        message.guild,
        "alliance",
        "🤝 Nueva alianza",
        allianceText,
        COLORS.success
      );

    } catch {
      // Invitación inválida o no disponible.
    }
  }
);

// ======================================================
// READY
// ======================================================

client.once(
  "clientReady",
  async () => {

    console.log(
      `✅ ${client.user.tag} está conectado.`
    );

    console.log(
      `🌐 Servidores: ${client.guilds.cache.size}`
    );

    console.log(
      `🏓 Ping: ${client.ws.ping}ms`
    );

    // ================================================
    // REGISTRAR SLASH COMMANDS
    // ================================================

    try {

      const rest =
        new REST({
          version: "10"
        }).setToken(TOKEN);

      await rest.put(
        Routes.applicationCommands(
          CLIENT_ID
        ),
        {
          body: commands
        }
      );

      console.log(
        `✅ ${commands.length} comandos registrados.`
      );

    } catch (error) {

      console.error(
        "❌ Error registrando comandos:",
        error
      );
    }

    // ================================================
    // CACHE DE INVITACIONES
    // ================================================

    for (
      const guild
      of client.guilds.cache.values()
    ) {
      await cacheInvites(
        guild
      );
    }

    // ================================================
    // PRESENCIA
    // ================================================

    client.user.setPresence({
      activities: [
        {
          name: "LRM Studio 💜",
          type: 3
        }
      ],
      status: "online"
    });
  }
);

// ======================================================
// NUEVO SERVIDOR
// ======================================================

client.on(
  "guildCreate",
  async guild => {

    console.log(
      `➕ Unido a: ${guild.name}`
    );

    await cacheInvites(
      guild
    );

    saveData();
  }
);

// ======================================================
// ERRORES
// ======================================================

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// ======================================================
// LOGIN
// ======================================================

if (!TOKEN) {
  console.error(
    "❌ Falta DISCORD_TOKEN en las variables de entorno."
  );

  process.exit(1);
}

if (!CLIENT_ID) {
  console.error(
    "❌ Falta CLIENT_ID en las variables de entorno."
  );

  process.exit(1);
}

client.login(TOKEN);
