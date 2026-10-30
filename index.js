const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const { setupAdmin, adminCommands } = require("./admin");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const PREFIX = ".";
const DATA_FILE = "./data.json";

// =====================================================
// COLORES
// =====================================================

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

// =====================================================
// SIMBOLOS
// =====================================================

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

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites
  ]
});

// =====================================================
// PLANTILLAS
// =====================================================

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

// =====================================================
// DATA
// =====================================================

const DEFAULT_DATA = {
  users: {},
  shop: [],

  settings: {
    logs: {
      general: null,
      economia: null,
      tienda: null,
      niveles: null,
      admin: null
    },

    systemChannels: {
      bienvenida: null,
      invites: null,
      niveles: null,
      alianzas: null,
      affys: null,
      sugerencias: null,
      honeypot: null
    }
  },

  ticketSystem: {
    panels: {},
    staffRoles: {},
    openTickets: {},

    logs: {
      valoraciones: null,
      transacciones: null,
      tickets: null
    }
  },

  inviteSystem: {
    users: {},
    members: {}
  },

  partners: {},

  moderation: {
    warnings: {}
  },

  honeypot: {
    message: HONEYPOT_TEMPLATE,
    channelId: null,
    messageId: null,
    bans: 0
  }
};

function freshData() {
  return JSON.parse(
    JSON.stringify(DEFAULT_DATA)
  );
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const fresh = freshData();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(fresh, null, 2)
    );

    return fresh;
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )
    );

    parsed.users ??= {};
    parsed.shop ??= [];

    if (Array.isArray(parsed.users)) {
      parsed.users = {};
    }

    if (!Array.isArray(parsed.shop)) {
      parsed.shop = [];
    }

    parsed.settings ??= {};
    parsed.settings.logs ??= {};

    for (const log of [
      "general",
      "economia",
      "tienda",
      "niveles",
      "admin"
    ]) {
      parsed.settings.logs[log] ??= null;
    }

    parsed.settings.systemChannels ??= {};

    for (const key of [
      "bienvenida",
      "invites",
      "niveles",
      "alianzas",
      "affys",
      "sugerencias",
      "honeypot"
    ]) {
      parsed.settings.systemChannels[key] ??= null;
    }

    parsed.ticketSystem ??= {};
    parsed.ticketSystem.panels ??= {};
    parsed.ticketSystem.staffRoles ??= {};
    parsed.ticketSystem.openTickets ??= {};
    parsed.ticketSystem.logs ??= {};

    parsed.ticketSystem.logs.valoraciones ??= null;
    parsed.ticketSystem.logs.transacciones ??= null;
    parsed.ticketSystem.logs.tickets ??= null;

    parsed.inviteSystem ??= {};
    parsed.inviteSystem.users ??= {};
    parsed.inviteSystem.members ??= {};

    parsed.partners ??= {};

    parsed.moderation ??= {};
    parsed.moderation.warnings ??= {};

    parsed.honeypot ??= {};
    parsed.honeypot.message ??=
      HONEYPOT_TEMPLATE;

    parsed.honeypot.channelId ??=
      parsed.settings.systemChannels.honeypot ||
      null;

    parsed.honeypot.messageId ??= null;
    parsed.honeypot.bans ??= 0;

    return parsed;
  } catch (error) {
    console.error(
      "Error leyendo data.json:",
      error
    );

    return freshData();
  }
}

const data = loadData();

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

// =====================================================
// USUARIOS
// =====================================================

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
  }

  const account =
    data.users[id];

  account.wallet ??= 0;
  account.bank ??= 0;
  account.inventory ??= [];
  account.xp ??= 0;
  account.level ??= 1;
  account.cooldowns ??= {};

  account.luckRoyale ??= {
    spins: 0,
    wins2: 0,
    wins3: 0
  };

  account.luckRoyale.spins ??= 0;
  account.luckRoyale.wins2 ??= 0;
  account.luckRoyale.wins3 ??= 0;

  return account;
}

// =====================================================
// UTILIDADES
// =====================================================

function random(min, max) {
  return Math.floor(
    Math.random() *
      (max - min + 1)
  ) + min;
}

function money(value) {
  return `$${Math.floor(
    value
  ).toLocaleString("es-ES")}`;
}

function glassEmbed(
  color = COLORS.primary
) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text:
        "LRM Studio  •  Fluent Glass"
    });
}

function errorEmbed(text) {
  return glassEmbed(
    COLORS.error
  )
    .setTitle(
      `${E.error}  Error`
    )
    .setDescription(text);
}

function successEmbed(text) {
  return glassEmbed(
    COLORS.success
  )
    .setTitle(
      `${E.success}  Completado`
    )
    .setDescription(text);
}

function cooldown(
  account,
  name,
  duration
) {
  const now = Date.now();

  const last =
    account.cooldowns[name] || 0;

  const remaining =
    duration -
    (now - last);

  if (remaining > 0) {
    return remaining;
  }

  account.cooldowns[name] = now;

  saveData();

  return 0;
}

// =====================================================
// RANK
// =====================================================

function getLevelRank(userId) {
  const ranking =
    Object.entries(
      data.users
    ).sort((a, b) => {
      const levelDifference =
        (b[1].level || 1) -
        (a[1].level || 1);

      if (
        levelDifference !== 0
      ) {
        return levelDifference;
      }

      return (
        (b[1].xp || 0) -
        (a[1].xp || 0)
      );
    });

  const position =
    ranking.findIndex(
      ([id]) =>
        id === userId
    );

  return position === -1
    ? ranking.length + 1
    : position + 1;
}

// =====================================================
// LEVEL UP
// =====================================================

async function sendLevelUp(
  guild,
  userId,
  account
) {
  if (!guild) return;

  const channelId =
    data.settings
      .systemChannels
      .niveles;

  if (!channelId) return;

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (!channel?.isTextBased()) {
    return;
  }

  const rank =
    getLevelRank(userId);

  const text =
    LEVEL_TEMPLATE
      .replaceAll(
        "$(user.mention)",
        `<@${userId}>`
      )
      .replaceAll(
        "$(level)",
        String(account.level)
      )
      .replaceAll(
        "$(xp)",
        String(account.xp)
      )
      .replaceAll(
        "$(rank)",
        String(rank)
      );

  await channel
    .send({
      embeds: [
        glassEmbed(
          COLORS.level
        ).setDescription(text)
      ]
    })
    .catch(() => {});
}

async function addXP(
  id,
  amount = random(3, 8),
  guild = null
) {
  const account =
    getUser(id);

  account.xp += amount;

  let levelsGained = 0;

  while (
    account.xp >=
    account.level * 100
  ) {
    account.xp -=
      account.level * 100;

    account.level++;

    levelsGained++;
  }

  saveData();

  if (
    levelsGained > 0 &&
    guild
  ) {
    await sendLevelUp(
      guild,
      id,
      account
    );
  }

  return levelsGained > 0;
}

// =====================================================
// LOGS
// =====================================================

async function sendLog(
  guild,
  type,
  options = {}
) {
  const id =
    data.settings?.logs?.[type];

  if (!id) return;

  const channel =
    guild.channels.cache.get(id);

  if (!channel?.isTextBased()) {
    return;
  }

  const logEmbed =
    glassEmbed(
      options.color ||
      COLORS.info
    )
      .setTitle(
        options.title ||
        "Log"
      )
      .setDescription(
        options.description ||
        "Sin información."
      )
      .setTimestamp();

  if (
    options.fields?.length
  ) {
    logEmbed.addFields(
      options.fields
    );
  }

  await channel
    .send({
      embeds: [logEmbed]
    })
    .catch(() => {});
}

async function logAction(
  guild,
  type,
  options
) {
  await sendLog(
    guild,
    type,
    options
  );

  if (type !== "general") {
    await sendLog(
      guild,
      "general",
      options
    );
  }
}

// =====================================================
// INVITES
// =====================================================

const inviteCache =
  new Map();

async function cacheGuildInvites(
  guild
) {
  const invites =
    await guild.invites
      .fetch()
      .catch(() => null);

  if (!invites) {
    return;
  }

  inviteCache.set(
    guild.id,
    new Map(
      invites.map(
        invite => [
          invite.code,
          invite.uses || 0
        ]
      )
    )
  );
}

function ensureInviteStats(
  userId
) {
  data.inviteSystem.users[
    userId
  ] ??= {
    invites: 0,
    newAccounts: 0,
    leaves: 0
  };

  const stats =
    data.inviteSystem.users[
      userId
    ];

  stats.invites ??= 0;
  stats.newAccounts ??= 0;
  stats.leaves ??= 0;

  return stats;
}

function isNewAccount(user) {
  const age =
    Date.now() -
    user.createdTimestamp;

  return (
    age <
    7 * 24 * 60 * 60 * 1000
  );
}

client.on(
  "inviteCreate",
  async invite => {
    await cacheGuildInvites(
      invite.guild
    );
  }
);

client.on(
  "inviteDelete",
  async invite => {
    await cacheGuildInvites(
      invite.guild
    );
  }
);

client.on(
  "guildMemberAdd",
  async member => {
    const guild =
      member.guild;

    // WELCOME
    const welcomeChannelId =
      data.settings
        .systemChannels
        .bienvenida;

    const welcomeChannel =
      welcomeChannelId
        ? guild.channels.cache.get(
            welcomeChannelId
          )
        : null;

    if (
      welcomeChannel?.isTextBased()
    ) {
      const text =
        WELCOME_TEMPLATE
          .replaceAll(
            "$(user.mention)",
            `${member}`
          )
          .replaceAll(
            "$(server.member_count)",
            String(
              guild.memberCount
            )
          );

      await welcomeChannel
        .send({
          embeds: [
            glassEmbed(
              COLORS.primary
            ).setDescription(
              text
            )
          ]
        })
        .catch(() => {});
    }

    // INVITE
    const before =
      inviteCache.get(
        guild.id
      ) ||
      new Map();

    const current =
      await guild.invites
        .fetch()
        .catch(() => null);

    if (!current) {
      return;
    }

    const usedInvite =
      current.find(invite => {
        const oldUses =
          before.get(
            invite.code
          ) || 0;

        return (
          (invite.uses || 0) >
          oldUses
        );
      });

    inviteCache.set(
      guild.id,
      new Map(
        current.map(
          invite => [
            invite.code,
            invite.uses || 0
          ]
        )
      )
    );

    if (
      !usedInvite?.inviter
    ) {
      return;
    }

    const inviter =
      usedInvite.inviter;

    const stats =
      ensureInviteStats(
        inviter.id
      );

    stats.invites++;

    const newAccount =
      isNewAccount(
        member.user
      );

    if (newAccount) {
      stats.newAccounts++;
    }

    data.inviteSystem.members[
      member.id
    ] = {
      inviterId:
        inviter.id,
      joinedAt:
        Date.now(),
      newAccount
    };

    saveData();

    const inviteChannelId =
      data.settings
        .systemChannels
        .invites;

    const inviteChannel =
      inviteChannelId
        ? guild.channels.cache.get(
            inviteChannelId
          )
        : null;

    if (
      inviteChannel?.isTextBased()
    ) {
      const text =
        INVITE_TEMPLATE
          .replaceAll(
            "$(inviter.mention)",
            `${inviter}`
          )
          .replaceAll(
            "$(inviter.invites)",
            String(
              stats.invites
            )
          )
          .replaceAll(
            "$(server.member_count)",
            String(
              guild.memberCount
            )
          );

      await inviteChannel
        .send({
          embeds: [
            glassEmbed(
              COLORS.info
            ).setDescription(
              text
            )
          ]
        })
        .catch(() => {});
    }
  }
);

client.on(
  "guildMemberRemove",
  member => {
    const tracked =
      data.inviteSystem.members[
        member.id
      ];

    if (
      !tracked?.inviterId
    ) {
      return;
    }

    const stats =
      ensureInviteStats(
        tracked.inviterId
      );

    stats.leaves++;

    delete data
      .inviteSystem
      .members[
        member.id
      ];

    saveData();
  }
);

// =====================================================
// PARTNERS
// =====================================================

function ensurePartner(
  userId
) {
  data.partners[userId] ??= {
    points: 0,
    alliances: 0,
    affys: 0
  };

  const partner =
    data.partners[userId];

  partner.points ??= 0;
  partner.alliances ??= 0;
  partner.affys ??= 0;

  return partner;
}

function getPartnerRank(
  userId
) {
  const ranking =
    Object.entries(
      data.partners
    ).sort(
      (a, b) =>
        (b[1].points || 0) -
        (a[1].points || 0)
    );

  const index =
    ranking.findIndex(
      ([id]) =>
        id === userId
    );

  return index === -1
    ? ranking.length + 1
    : index + 1;
}

function extractInviteCode(
  text
) {
  const match =
    String(text).match(
      /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)([A-Za-z0-9-]+)/i
    );

  return match?.[1] || null;
}

async function processPartnerInvite(
  message,
  type
) {
  const code =
    extractInviteCode(
      message.content
    );

  if (!code) {
    return;
  }

  const invite =
    await client
      .fetchInvite(code)
      .catch(() => null);

  if (!invite?.guild) {
    return;
  }

  if (
    invite.guild.id ===
    message.guild.id
  ) {
    return;
  }

  const partner =
    ensurePartner(
      message.author.id
    );

  partner.points++;

  if (
    type === "alianza"
  ) {
    partner.alliances++;
  } else {
    partner.affys++;
  }

  saveData();

  const rank =
    getPartnerRank(
      message.author.id
    );

  const template =
    type === "alianza"
      ? ALLIANCE_TEMPLATE
      : AFFY_TEMPLATE;

  const text =
    template
      .replaceAll(
        "$(invite.guild.name)",
        invite.guild.name ||
          "Servidor"
      )
      .replaceAll(
        "$(user.mention)",
        `${message.author}`
      )
      .replaceAll(
        "$(partner.rank)",
        String(rank)
      )
      .replaceAll(
        "$(partner.points)",
        String(
          partner.points
        )
      );

  await message
    .reply({
      embeds: [
        glassEmbed(
          type === "alianza"
            ? COLORS.primary
            : COLORS.royale
        ).setDescription(
          text
        )
      ]
    })
    .catch(() => {});
}

// =====================================================
// LUCK ROYALE
// =====================================================

const ROYALE_EMOJIS = [
  "🍒",
  "💎",
  "⭐",
  "🍀",
  "🔥",
  "👑",
  "🌙",
  "⚡",
  "🎯",
  "🪙",
  "🎁",
  "🏆",
  "🧿",
  "🔮",
  "🌟"
];

function royaleEmoji() {
  return ROYALE_EMOJIS[
    random(
      0,
      ROYALE_EMOJIS.length - 1
    )
  ];
}

function royaleRoll() {
  return [
    royaleEmoji(),
    royaleEmoji(),
    royaleEmoji()
  ];
}

function royaleText(roll) {
  return `╭──────────────╮
│   ${roll[0]}   ${roll[1]}   ${roll[2]}   │
╰──────────────╯`;
}

function royaleResult(roll) {
  const [a, b, c] =
    roll;

  if (
    a === b &&
    b === c
  ) {
    return "triple";
  }

  if (
    a === b ||
    a === c ||
    b === c
  ) {
    return "double";
  }

  return "none";
}

function royaleWarning(
  userId
) {
  const row =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `royale_accept:${userId}`
          )
          .setLabel(
            "Aceptar"
          )
          .setStyle(
            ButtonStyle.Success
          ),

        new ButtonBuilder()
          .setCustomId(
            `royale_reject:${userId}`
          )
          .setLabel(
            "Rechazar"
          )
          .setStyle(
            ButtonStyle.Secondary
          )
      );

  return {
    embeds: [
      glassEmbed(
        COLORS.royale
      )
        .setTitle(
          `${E.royale}  Luck Royale`
        )
        .setDescription(
          `Estás a punto de iniciar **Luck Royale**.\n\n` +
          `Esta versión usa una **tirada gratuita** y no descuenta dinero de tu balance.\n\n` +
          `**Premios**\n` +
          `${E.gain} 3 emojis iguales → premio especial\n` +
          `${E.gain} 2 emojis iguales → premio normal\n` +
          `${E.loss} Todos diferentes → sin premio\n\n` +
          `Hay **${ROYALE_EMOJIS.length} símbolos** diferentes en la ruleta.\n\n` +
          `¿Quieres comenzar?`
        )
    ],
    components: [
      row
    ]
  };
}

async function startRoyale(
  interaction
) {
  const user =
    interaction.user;

  const account =
    getUser(user.id);

  const remaining =
    cooldown(
      account,
      "luckroyale",
      30_000
    );

  if (remaining) {
    return interaction.update({
      embeds: [
        errorEmbed(
          `Debes esperar **${Math.ceil(
            remaining / 1000
          )} segundos** antes de volver a jugar.`
        )
      ],
      components: []
    });
  }

  account.luckRoyale.spins++;

  saveData();

  await interaction.update({
    embeds: [
      glassEmbed(
        COLORS.royale
      )
        .setTitle(
          `${E.royale}  Luck Royale`
        )
        .setDescription(
          `**Girando...**\n\n` +
          royaleText(
            royaleRoll()
          )
        )
    ],
    components: []
  });

  for (
    let i = 0;
    i < 8;
    i++
  ) {
    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );

    await interaction
      .editReply({
        embeds: [
          glassEmbed(
            COLORS.royale
          )
            .setTitle(
              `${E.royale}  Luck Royale`
            )
            .setDescription(
              `**Girando... ${
                i + 1
              }/8**\n\n` +
              royaleText(
                royaleRoll()
              )
            )
        ]
      })
      .catch(() => {});
  }

  const finalRoll =
    royaleRoll();

  const result =
    royaleResult(
      finalRoll
    );

  let resultText;

  if (
    result === "triple"
  ) {
    account.luckRoyale.wins3++;

    const prize =
      `Premio Royale ${finalRoll[0]}`;

    account.inventory.push(
      prize
    );

    resultText =
      `${E.success} **JACKPOT**\n\n` +
      `Conseguiste **3 símbolos iguales**.\n\n` +
      `${E.inventory} Recibiste:\n**${prize}**`;
  } else if (
    result === "double"
  ) {
    account.luckRoyale.wins2++;

    const prize =
      "Ficha Royale";

    account.inventory.push(
      prize
    );

    resultText =
      `${E.success} **¡Ganaste!**\n\n` +
      `Conseguiste **2 símbolos iguales**.\n\n` +
      `${E.inventory} Recibiste:\n**${prize}**`;
  } else {
    resultText =
      `${E.loss} **Sin premio**\n\n` +
      `Los 3 símbolos fueron diferentes.`;
  }

  await addXP(
    user.id,
    result === "triple"
      ? 15
      : result === "double"
        ? 8
        : 3,
    interaction.guild
  );

  saveData();

  return interaction.editReply({
    embeds: [
      glassEmbed(
        result === "none"
          ? COLORS.warning
          : COLORS.royale
      )
        .setTitle(
          `${E.royale}  Resultado`
        )
        .setDescription(
          `${royaleText(
            finalRoll
          )}\n\n${resultText}\n\n` +
          `**Estadísticas**\n` +
          `Tiradas: **${account.luckRoyale.spins}**\n` +
          `Dobles: **${account.luckRoyale.wins2}**\n` +
          `Triples: **${account.luckRoyale.wins3}**`
        )
    ]
  });
}

// =====================================================
// SLASH USER
// =====================================================

const userCommands = [

  new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Muestra los comandos."
    ),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription(
      "Consulta un balance."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
    ),

  new SlashCommandBuilder()
    .setName("work")
    .setDescription(
      "Trabaja y consigue dinero."
    ),

  new SlashCommandBuilder()
    .setName("risk")
    .setDescription(
      "Arriesga dinero."
    ),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription(
      "Intenta conseguir dinero mediante crime."
    ),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription(
      "Recompensa diaria."
    ),

  new SlashCommandBuilder()
    .setName("dep")
    .setDescription(
      "Deposita dinero."
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription(
          "Cantidad"
        )
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("with")
    .setDescription(
      "Retira dinero."
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription(
          "Cantidad"
        )
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription(
      "Envía dinero."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription(
          "Cantidad"
        )
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription(
      "Muestra un perfil."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
    ),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription(
      "Muestra tu inventario."
    ),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription(
      "Muestra tu nivel."
    ),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription(
      "Muestra la tienda."
    ),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription(
      "Compra un objeto."
    )
    .addStringOption(o =>
      o.setName("producto")
        .setDescription(
          "Producto"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription(
      "Usa un objeto."
    )
    .addStringOption(o =>
      o.setName("objeto")
        .setDescription(
          "Objeto"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("baltop")
    .setDescription(
      "Ranking de dinero."
    ),

  new SlashCommandBuilder()
    .setName("leveltop")
    .setDescription(
      "Ranking de niveles."
    ),

  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription(
      "Cara o cruz."
    ),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription(
      "Pregunta a la bola."
    )
    .addStringOption(o =>
      o.setName("pregunta")
        .setDescription(
          "Pregunta"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("random")
    .setDescription(
      "Genera un número aleatorio."
    )
    .addIntegerOption(o =>
      o.setName("min")
        .setDescription(
          "Mínimo"
        )
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("max")
        .setDescription(
          "Máximo"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("dice")
    .setDescription(
      "Lanza un dado."
    ),

  new SlashCommandBuilder()
    .setName("choose")
    .setDescription(
      "Elige entre varias opciones."
    )
    .addStringOption(o =>
      o.setName("opciones")
        .setDescription(
          "Minecraft | Sonic | Rocket League"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rps")
    .setDescription(
      "Piedra, papel o tijera."
    )
    .addStringOption(o =>
      o.setName("eleccion")
        .setDescription(
          "Tu elección"
        )
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
    .setDescription(
      "Juega Luck Royale."
    ),

  new SlashCommandBuilder()
    .setName("invitever")
    .setDescription(
      "Muestra estadísticas de invitaciones."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
    ),

  new SlashCommandBuilder()
    .setName("sugerencia")
    .setDescription(
      "Envía una sugerencia."
    )
    .addStringOption(o =>
      o.setName("mensaje")
        .setDescription(
          "Sugerencia"
        )
        .setMaxLength(1500)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Muestra el ping."
    ),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription(
      "Información del bot."
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription(
      "Información del servidor."
    ),

  new SlashCommandBuilder()
    .setName("membercount")
    .setDescription(
      "Muestra la cantidad de miembros."
    ),

  new SlashCommandBuilder()
    .setName("uptime")
    .setDescription(
      "Muestra el tiempo encendido."
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription(
      "Información de usuario."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(
      "Muestra un avatar."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription(
          "Usuario"
        )
    )
];

// =====================================================
// REGISTRO DE COMANDOS
// =====================================================

// IMPORTANTE:
// admin.js puede devolver SlashCommandBuilder
// o comandos que ya están en JSON.
// Esta función acepta ambos.

const allCommands = [
  ...userCommands,
  ...adminCommands
];

const commands =
  allCommands.map(command => {
    if (
      command &&
      typeof command.toJSON ===
        "function"
    ) {
      return command.toJSON();
    }

    return command;
  });

async function registerCommands() {
  if (
    !TOKEN ||
    !CLIENT_ID
  ) {
    console.error(
      "Falta DISCORD_TOKEN o CLIENT_ID."
    );

    return;
  }

  try {
    const rest =
      new REST({
        version: "10"
      }).setToken(
        TOKEN
      );

    await rest.put(
      Routes.applicationCommands(
        CLIENT_ID
      ),
      {
        body: commands
      }
    );

    console.log(
      `✓ ${commands.length} comandos slash registrados.`
    );
  } catch (error) {
    console.error(
      "Error registrando comandos:",
      error
    );
  }
}

// =====================================================
// ADMIN
// =====================================================

setupAdmin(
  client,
  {
    data,
    saveData,
    sendLog,
    logAction,
    getUser,
    prefix: PREFIX,
    colors: COLORS,
    symbols: E
  }
);

// =====================================================
// USER COMMAND LOGIC
// =====================================================

async function executeUserCommand(
  ctx
) {
  const {
    command,
    user,
    guild,
    member,
    getTarget,
    getInteger,
    getString,
    reply
  } = ctx;

  // ---------------------------------------------------
  // HELP
  // ---------------------------------------------------

  if (
    command === "help"
  ) {
    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            "◉ LRM Studio • Help"
          )
          .setDescription(
            `Usá **.help** para abrir el menú interactivo.\n\n` +
            `También podés usar **/help**.\n\n` +
            `Desde el menú vas a encontrar las categorías de comandos de LRM Studio.`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // LUCK ROYALE
  // ---------------------------------------------------

  if (
    command === "luckroyale"
  ) {
    return reply(
      royaleWarning(
        user.id
      )
    );
  }

  // ---------------------------------------------------
  // BALANCE
  // ---------------------------------------------------

  if (
    command === "balance"
  ) {
    const target =
      getTarget() ||
      user;

    const account =
      getUser(
        target.id
      );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.economy
        )
          .setTitle(
            `${E.money}  Balance`
          )
          .setThumbnail(
            target.displayAvatarURL()
          )
          .setDescription(
            `${target}\n\n` +
            `${E.money} Wallet\n**${money(
              account.wallet
            )}**\n\n` +
            `${E.bank} Banco\n**${money(
              account.bank
            )}**\n\n` +
            `${E.transfer} Total\n**${money(
              account.wallet +
              account.bank
            )}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // WORK
  // ---------------------------------------------------

  if (
    command === "work"
  ) {
    const account =
      getUser(
        user.id
      );

    const remaining =
      cooldown(
        account,
        "work",
        30_000
      );

    if (remaining) {
      return reply({
        embeds: [
          errorEmbed(
            `Espera **${Math.ceil(
              remaining / 1000
            )}s**.`
          )
        ]
      });
    }

    const reward =
      random(
        20,
        30
      );

    account.wallet +=
      reward;

    await addXP(
      user.id,
      random(3, 8),
      guild
    );

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Ganaste **${money(
            reward
          )}** trabajando.\n\n` +
          `Wallet: **${money(
            account.wallet
          )}**`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // RISK
  // ---------------------------------------------------

  if (
    command === "risk"
  ) {
    const account =
      getUser(
        user.id
      );

    const remaining =
      cooldown(
        account,
        "risk",
        60_000
      );

    if (remaining) {
      return reply({
        embeds: [
          errorEmbed(
            `Debes esperar **${Math.ceil(
              remaining / 1000
            )}s** antes de usar risk nuevamente.`
          )
        ]
      });
    }

    const won =
      Math.random() < 0.30;

    if (won) {
      const amount =
        random(
          40,
          70
        );

      account.wallet +=
        amount;

      await addXP(
        user.id,
        random(3, 8),
        guild
      );

      saveData();

      return reply({
        embeds: [
          glassEmbed(
            COLORS.success
          )
            .setTitle(
              `${E.gain}  Risk`
            )
            .setDescription(
              `**¡Ganaste!**\n\n` +
              `Recibiste **${money(
                amount
              )}**.\n\n` +
              `Wallet: **${money(
                account.wallet
              )}**`
            )
        ]
      });
    }

    const loss =
      random(
        50,
        100
      );

    account.wallet -=
      loss;

    await addXP(
      user.id,
      random(3, 8),
      guild
    );

    saveData();

    return reply({
      embeds: [
        glassEmbed(
          COLORS.error
        )
          .setTitle(
            `${E.loss}  Risk`
          )
          .setDescription(
            `**Perdiste.**\n\n` +
            `Perdiste **${money(
              loss
            )}**.\n\n` +
            `Wallet: **${money(
              account.wallet
            )}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // CRIME
  // ---------------------------------------------------

  if (
    command === "crime"
  ) {
    const account =
      getUser(
        user.id
      );

    const remaining =
      cooldown(
        account,
        "crime",
        120_000
      );

    if (remaining) {
      return reply({
        embeds: [
          errorEmbed(
            `Debes esperar **${Math.ceil(
              remaining / 1000
            )}s** antes de usar crime nuevamente.`
          )
        ]
      });
    }

    const won =
      Math.random() < 0.20;

    if (won) {
      const amount =
        random(
          50,
          80
        );

      account.wallet +=
        amount;

      await addXP(
        user.id,
        random(3, 8),
        guild
      );

      saveData();

      return reply({
        embeds: [
          glassEmbed(
            COLORS.success
          )
            .setTitle(
              `${E.gain}  Crime`
            )
            .setDescription(
              `**¡Salió bien!**\n\n` +
              `Ganaste **${money(
                amount
              )}**.\n\n` +
              `Wallet: **${money(
                account.wallet
              )}**`
            )
        ]
      });
    }

    const loss =
      random(
        70,
        200
      );

    account.wallet -=
      loss;

    await addXP(
      user.id,
      random(3, 8),
      guild
    );

    saveData();

    return reply({
      embeds: [
        glassEmbed(
          COLORS.error
        )
          .setTitle(
            `${E.loss}  Crime`
          )
          .setDescription(
            `**Fallaste.**\n\n` +
            `Perdiste **${money(
              loss
            )}**.\n\n` +
            `Wallet: **${money(
              account.wallet
            )}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // DAILY
  // ---------------------------------------------------

  if (
    command === "daily"
  ) {
    const account =
      getUser(
        user.id
      );

    const remaining =
      cooldown(
        account,
        "daily",
        86_400_000
      );

    if (remaining) {
      return reply({
        embeds: [
          errorEmbed(
            "Tu daily todavía no está disponible."
          )
        ]
      });
    }

    account.wallet +=
      50;

    await addXP(
      user.id,
      5,
      guild
    );

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Recibiste **$50**.\n\n` +
          `Wallet: **${money(
            account.wallet
          )}**`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // DEP / WITH
  // ---------------------------------------------------

  if (
    command === "dep" ||
    command === "with"
  ) {
    const amount =
      getInteger(0);

    if (
      !amount ||
      amount <= 0
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Indica una cantidad válida."
          )
        ]
      });
    }

    const account =
      getUser(
        user.id
      );

    if (
      command === "dep"
    ) {
      if (
        account.wallet <
        amount
      ) {
        return reply({
          embeds: [
            errorEmbed(
              "No tienes suficiente dinero."
            )
          ]
        });
      }

      account.wallet -=
        amount;

      account.bank +=
        amount;
    } else {
      if (
        account.bank <
        amount
      ) {
        return reply({
          embeds: [
            errorEmbed(
              "No tienes suficiente dinero en el banco."
            )
          ]
        });
      }

      account.bank -=
        amount;

      account.wallet +=
        amount;
    }

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `${E.money} Wallet: **${money(
            account.wallet
          )}**\n` +
          `${E.bank} Banco: **${money(
            account.bank
          )}**`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // PAY
  // ---------------------------------------------------

  if (
    command === "pay"
  ) {
    const target =
      getTarget();

    const amount =
      getInteger(0);

    if (
      !target ||
      !amount ||
      amount <= 0
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Uso: `.pay @usuario cantidad`"
          )
        ]
      });
    }

    if (
      target.id ===
        user.id ||
      target.bot
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "No puedes enviar dinero a ese usuario."
          )
        ]
      });
    }

    const sender =
      getUser(
        user.id
      );

    const receiver =
      getUser(
        target.id
      );

    if (
      sender.wallet <
      amount
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero."
          )
        ]
      });
    }

    sender.wallet -=
      amount;

    receiver.wallet +=
      amount;

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Enviaste **${money(
            amount
          )}** a ${target}.`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // PROFILE
  // ---------------------------------------------------

  if (
    command === "profile"
  ) {
    const target =
      getTarget() ||
      user;

    const account =
      getUser(
        target.id
      );

    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.user}  Perfil`
          )
          .setThumbnail(
            target.displayAvatarURL()
          )
          .setDescription(
            `**${target.username}**\n\n` +
            `${E.money} Wallet: **${money(
              account.wallet
            )}**\n` +
            `${E.bank} Banco: **${money(
              account.bank
            )}**\n` +
            `${E.level} Nivel: **${account.level}**\n` +
            `XP: **${account.xp}/${account.level * 100}**\n` +
            `Rank: **#${getLevelRank(
              target.id
            )}**\n` +
            `${E.inventory} Objetos: **${account.inventory.length}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // INVENTORY
  // ---------------------------------------------------

  if (
    command === "inventory"
  ) {
    const account =
      getUser(
        user.id
      );

    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.inventory}  Inventario`
          )
          .setDescription(
            account.inventory.length
              ? account.inventory
                  .map(
                    (
                      item,
                      index
                    ) =>
                      `**${
                        index + 1
                      }.** ${item}`
                  )
                  .join("\n")
              : "Tu inventario está vacío."
          )
      ]
    });
  }

  // ---------------------------------------------------
  // RANK
  // ---------------------------------------------------

  if (
    command === "rank"
  ) {
    const account =
      getUser(
        user.id
      );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.level
        )
          .setTitle(
            `${E.level}  Rank`
          )
          .setDescription(
            `Nivel **${account.level}**\n\n` +
            `XP **${account.xp}/${account.level * 100}**\n` +
            `Rank global **#${getLevelRank(
              user.id
            )}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // SHOP
  // ---------------------------------------------------

  if (
    command === "shop"
  ) {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.economy
        )
          .setTitle(
            `${E.shop}  Tienda`
          )
          .setDescription(
            data.shop.length
              ? data.shop
                  .map(
                    (
                      item,
                      index
                    ) =>
                      `**${
                        index + 1
                      }. ${item.name}**\n${money(
                        item.price
                      )}`
                  )
                  .join(
                    "\n\n"
                  )
              : "La tienda está vacía."
          )
      ]
    });
  }

  // ---------------------------------------------------
  // BUY
  // ---------------------------------------------------

  if (
    command === "buy"
  ) {
    const productName =
      getString();

    const product =
      data.shop.find(
        item =>
          item.name
            .toLowerCase() ===
          productName?.toLowerCase()
      );

    if (!product) {
      return reply({
        embeds: [
          errorEmbed(
            "No encontré ese producto."
          )
        ]
      });
    }

    const account =
      getUser(
        user.id
      );

    if (
      account.wallet <
      product.price
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero."
          )
        ]
      });
    }

    if (
      product.type ===
        "role" &&
      product.roleId
    ) {
      const role =
        guild.roles.cache.get(
          product.roleId
        );

      if (!role) {
        return reply({
          embeds: [
            errorEmbed(
              "Ese rol ya no existe."
            )
          ]
        });
      }

      try {
        await member.roles.add(
          role
        );
      } catch {
        return reply({
          embeds: [
            errorEmbed(
              "No pude darte ese rol. Revisa la jerarquía de roles del bot."
            )
          ]
        });
      }

      account.wallet -=
        product.price;
    } else {
      account.wallet -=
        product.price;

      account.inventory.push(
        product.name
      );
    }

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Compraste **${product.name}** por **${money(
            product.price
          )}**.`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // USE
  // ---------------------------------------------------

  if (
    command === "use"
  ) {
    const itemName =
      getString();

    const account =
      getUser(
        user.id
      );

    const index =
      account.inventory
        .findIndex(
          item =>
            String(item)
              .toLowerCase() ===
            itemName?.toLowerCase()
        );

    if (
      index === -1
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "No tienes ese objeto."
          )
        ]
      });
    }

    const item =
      account.inventory[
        index
      ];

    account.inventory.splice(
      index,
      1
    );

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Usaste **${item}**.`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // BALTOP
  // ---------------------------------------------------

  if (
    command === "baltop"
  ) {
    const top =
      Object.entries(
        data.users
      )
        .sort(
          (a, b) =>
            (
              (b[1].wallet || 0) +
              (b[1].bank || 0)
            ) -
            (
              (a[1].wallet || 0) +
              (a[1].bank || 0)
            )
        )
        .slice(
          0,
          10
        );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.economy
        )
          .setTitle(
            `${E.money}  Balance Top`
          )
          .setDescription(
            top.length
              ? top
                  .map(
                    (
                      [
                        id,
                        account
                      ],
                      index
                    ) =>
                      `**${
                        index + 1
                      }.** <@${id}> • **${money(
                        (account.wallet || 0) +
                        (account.bank || 0)
                      )}**`
                  )
                  .join(
                    "\n"
                  )
              : "No hay datos."
          )
      ]
    });
  }

  // ---------------------------------------------------
  // LEVELTOP
  // ---------------------------------------------------

  if (
    command === "leveltop"
  ) {
    const top =
      Object.entries(
        data.users
      )
        .sort(
          (a, b) =>
            (b[1].level || 1) -
              (a[1].level || 1) ||
            (b[1].xp || 0) -
              (a[1].xp || 0)
        )
        .slice(
          0,
          10
        );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.level
        )
          .setTitle(
            `${E.level}  Level Top`
          )
          .setDescription(
            top.length
              ? top
                  .map(
                    (
                      [
                        id,
                        account
                      ],
                      index
                    ) =>
                      `**${
                        index + 1
                      }.** <@${id}> • Nivel **${
                        account.level || 1
                      }** • XP **${
                        account.xp || 0
                      }**`
                  )
                  .join(
                    "\n"
                  )
              : "No hay datos."
          )
      ]
    });
  }

  // ---------------------------------------------------
  // COINFLIP
  // ---------------------------------------------------

  if (
    command === "coinflip"
  ) {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.random}  Coinflip`
          )
          .setDescription(
            Math.random() <
              0.5
              ? "**Cara**"
              : "**Cruz**"
          )
      ]
    });
  }

  // ---------------------------------------------------
  // 8BALL
  // ---------------------------------------------------

  if (
    command === "8ball"
  ) {
    const question =
      getString();

    if (!question) {
      return reply({
        embeds: [
          errorEmbed(
            "Escribe una pregunta."
          )
        ]
      });
    }

    const answers = [
      "Sí.",
      "No.",
      "Probablemente.",
      "Puede ser.",
      "Todo apunta a que sí.",
      "No parece.",
      "Pregunta después.",
      "Es posible."
    ];

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.random}  8Ball`
          )
          .setDescription(
            `**Pregunta**\n${question}\n\n` +
            `**Respuesta**\n${
              answers[
                random(
                  0,
                  answers.length - 1
                )
              ]
            }`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // RANDOM
  // ---------------------------------------------------

  if (
    command === "random"
  ) {
    const min =
      getInteger(0);

    const max =
      getInteger(1);

    if (
      !Number.isInteger(
        min
      ) ||
      !Number.isInteger(
        max
      ) ||
      min > max
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Indica un mínimo y máximo válidos."
          )
        ]
      });
    }

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.random}  Random`
          )
          .setDescription(
            `Resultado: **${random(
              min,
              max
            )}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // DICE
  // ---------------------------------------------------

  if (
    command === "dice"
  ) {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            "🎲  Dado"
          )
          .setDescription(
            `Salió **${random(
              1,
              6
            )}**.`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // CHOOSE
  // ---------------------------------------------------

  if (
    command === "choose"
  ) {
    const choices =
      String(
        getString() || ""
      )
        .split("|")
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean);

    if (
      choices.length < 2
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Escribe al menos 2 opciones separadas por `|`."
          )
        ]
      });
    }

    if (
      choices.length > 20
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Máximo 20 opciones."
          )
        ]
      });
    }

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.random}  Choose`
          )
          .setDescription(
            `Elijo: **${
              choices[
                random(
                  0,
                  choices.length - 1
                )
              ]
            }**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // RPS
  // ---------------------------------------------------

  if (
    command === "rps"
  ) {
    const choice =
      String(
        getString() || ""
      ).toLowerCase();

    const valid = [
      "piedra",
      "papel",
      "tijera"
    ];

    if (
      !valid.includes(
        choice
      )
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "Elige `piedra`, `papel` o `tijera`."
          )
        ]
      });
    }

    const botChoice =
      valid[
        random(
          0,
          valid.length - 1
        )
      ];

    let result;

    if (
      choice ===
      botChoice
    ) {
      result =
        "Empate.";
    } else if (
      (
        choice ===
          "piedra" &&
        botChoice ===
          "tijera"
      ) ||
      (
        choice ===
          "papel" &&
        botChoice ===
          "piedra"
      ) ||
      (
        choice ===
          "tijera" &&
        botChoice ===
          "papel"
      )
    ) {
      result =
        "¡Ganaste!";
    } else {
      result =
        "Ganó el bot.";
    }

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            "◆ Piedra, papel o tijera"
          )
          .setDescription(
            `Vos: **${choice}**\n` +
            `Bot: **${botChoice}**\n\n` +
            `**${result}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // INVITEVER
  // ---------------------------------------------------

  if (
    command === "invitever"
  ) {
    const target =
      getTarget() ||
      user;

    const stats =
      ensureInviteStats(
        target.id
      );

    const validTotal =
      Math.max(
        0,
        stats.invites -
          stats.newAccounts -
          stats.leaves
      );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            "🔗・Invitaciones"
          )
          .setThumbnail(
            target.displayAvatarURL()
          )
          .setDescription(
            `${target}\n\n` +
            `📨 Invites: **${stats.invites}**\n` +
            `🆕 Cuentas nuevas: **${stats.newAccounts}**\n` +
            `🚪 Salidas: **${stats.leaves}**\n` +
            `⭐ Total válido: **${validTotal}**\n\n` +
            `*Total válido no incluye cuentas nuevas ni usuarios que salieron.*`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // SUGERENCIA
  // ---------------------------------------------------

  if (
    command === "sugerencia"
  ) {
    const suggestion =
      getString();

    if (!suggestion) {
      return reply({
        embeds: [
          errorEmbed(
            "Escribe tu sugerencia."
          )
        ]
      });
    }

    const channelId =
      data.settings
        .systemChannels
        .sugerencias;

    if (!channelId) {
      return reply({
        embeds: [
          errorEmbed(
            "El sistema de sugerencias todavía no está configurado."
          )
        ]
      });
    }

    const channel =
      guild.channels.cache.get(
        channelId
      );

    if (
      !channel?.isTextBased()
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "El canal de sugerencias configurado ya no existe."
          )
        ]
      });
    }

    const sent =
      await channel.send({
        embeds: [
          glassEmbed(
            COLORS.primary
          )
            .setTitle(
              "💡・Nueva Sugerencia"
            )
            .setAuthor({
              name:
                user.username,
              iconURL:
                user.displayAvatarURL()
            })
            .setDescription(
              suggestion
            )
            .setTimestamp()
        ]
      });

    await sent
      .react("👍")
      .catch(() => {});

    await sent
      .react("👎")
      .catch(() => {});

    return reply({
      embeds: [
        successEmbed(
          `Tu sugerencia fue enviada en ${channel}.`
        )
      ]
    });
  }

  // ---------------------------------------------------
  // PING
  // ---------------------------------------------------

  if (
    command === "ping"
  ) {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.info}  Ping`
          )
          .setDescription(
            `**${client.ws.ping}ms**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // BOTINFO
  // ---------------------------------------------------

  if (
    command === "botinfo"
  ) {
    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.info}  LRM Studio`
          )
          .setDescription(
            `Servidores: **${client.guilds.cache.size}**\n` +
            `Usuarios en caché: **${client.users.cache.size}**\n` +
            `Prefix: **.** + **/**\n` +
            `Node: **${process.version}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // SERVERINFO
  // ---------------------------------------------------

  if (
    command === "serverinfo"
  ) {
    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.info}  ${guild.name}`
          )
          .setThumbnail(
            guild.iconURL()
          )
          .setDescription(
            `ID: \`${guild.id}\`\n` +
            `Miembros: **${guild.memberCount}**\n` +
            `Canales: **${guild.channels.cache.size}**\n` +
            `Roles: **${guild.roles.cache.size}**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // MEMBERCOUNT
  // ---------------------------------------------------

  if (
    command === "membercount"
  ) {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            "○ Miembros"
          )
          .setDescription(
            `Actualmente somos **${guild.memberCount} miembros** en **${guild.name}**.`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // UPTIME
  // ---------------------------------------------------

  if (
    command === "uptime"
  ) {
    const seconds =
      Math.floor(
        process.uptime()
      );

    const days =
      Math.floor(
        seconds / 86400
      );

    const hours =
      Math.floor(
        (seconds % 86400) /
        3600
      );

    const minutes =
      Math.floor(
        (seconds % 3600) /
        60
      );

    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.time}  Uptime`
          )
          .setDescription(
            `**${days}d ${hours}h ${minutes}m**`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // USERINFO
  // ---------------------------------------------------

  if (
    command === "userinfo"
  ) {
    const target =
      getTarget() ||
      user;

    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.user}  ${target.username}`
          )
          .setThumbnail(
            target.displayAvatarURL()
          )
          .setDescription(
            `Usuario: ${target}\n` +
            `ID: \`${target.id}\`\n` +
            `Cuenta creada: <t:${Math.floor(
              target.createdTimestamp /
                1000
            )}:R>`
          )
      ]
    });
  }

  // ---------------------------------------------------
  // AVATAR
  // ---------------------------------------------------

  if (
    command === "avatar"
  ) {
    const target =
      getTarget() ||
      user;

    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.user}  Avatar`
          )
          .setImage(
            target.displayAvatarURL({
              size: 1024
            })
          )
      ]
    });
  }

  return false;
}

// =====================================================
// INTERACTIONS
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {
    try {

      // -------------------------------------------------
      // BOTONES
      // -------------------------------------------------

      if (
        interaction.isButton()
      ) {

        if (
          interaction.customId.startsWith(
            "royale_reject:"
          )
        ) {
          const ownerId =
            interaction.customId.split(
              ":"
            )[1];

          if (
            interaction.user.id !==
            ownerId
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Este Luck Royale no es tuyo."
                )
              ],
              flags: 64
            });
          }

          return interaction.update({
            embeds: [
              glassEmbed(
                COLORS.warning
              )
                .setTitle(
                  `${E.royale}  Luck Royale`
                )
                .setDescription(
                  "Tirada cancelada."
                )
            ],
            components: []
          });
        }

        if (
          interaction.customId.startsWith(
            "royale_accept:"
          )
        ) {
          const ownerId =
            interaction.customId.split(
              ":"
            )[1];

          if (
            interaction.user.id !==
            ownerId
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Este Luck Royale no es tuyo."
                )
              ],
              flags: 64
            });
          }

          return startRoyale(
            interaction
          );
        }

        return;
      }

      // -------------------------------------------------
      // SLASH
      // -------------------------------------------------

      if (
        !interaction.isChatInputCommand()
      ) {
        return;
      }

      const exists =
        userCommands.some(
          command =>
            command.name ===
            interaction.commandName
        );

      if (!exists) {
        return;
      }

      const command =
        interaction.commandName;

      const target =
        interaction.options.getUser(
          "usuario"
        );

      let integerValues =
        [];

      if (
        command === "dep" ||
        command === "with" ||
        command === "pay"
      ) {
        integerValues = [
          interaction.options.getInteger(
            "cantidad"
          )
        ];
      }

      if (
        command === "random"
      ) {
        integerValues = [
          interaction.options.getInteger(
            "min"
          ),
          interaction.options.getInteger(
            "max"
          )
        ];
      }

      let stringValue =
        null;

      if (
        command === "buy"
      ) {
        stringValue =
          interaction.options.getString(
            "producto"
          );
      }

      if (
        command === "use"
      ) {
        stringValue =
          interaction.options.getString(
            "objeto"
          );
      }

      if (
        command === "8ball"
      ) {
        stringValue =
          interaction.options.getString(
            "pregunta"
          );
      }

      if (
        command === "choose"
      ) {
        stringValue =
          interaction.options.getString(
            "opciones"
          );
      }

      if (
        command === "rps"
      ) {
        stringValue =
          interaction.options.getString(
            "eleccion"
          );
      }

      if (
        command === "sugerencia"
      ) {
        stringValue =
          interaction.options.getString(
            "mensaje"
          );
      }

      await executeUserCommand({
        command,
        user:
          interaction.user,
        guild:
          interaction.guild,
        member:
          interaction.member,

        getTarget:
          () => target,

        getInteger:
          index =>
            integerValues[
              index
            ],

        getString:
          () =>
            stringValue,

        reply:
          payload =>
            interaction.reply(
              payload
            )
      });

    } catch (error) {

      console.error(
        "Interaction error:",
        error
      );

      if (
        interaction.isRepliable() &&
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction
          .reply({
            embeds: [
              errorEmbed(
                "Ocurrió un error ejecutando el comando."
              )
            ],
            flags: 64
          })
          .catch(
            () => {}
          );
      }
    }
  }
);

// =====================================================
// MESSAGE CREATE
// =====================================================

client.on(
  "messageCreate",
  async message => {
    try {

      if (
        message.author.bot ||
        !message.guild
      ) {
        return;
      }

      // -----------------------------------------------
      // ALIANZAS
      // -----------------------------------------------

      if (
        message.channel.id ===
        data.settings
          .systemChannels
          .alianzas
      ) {
        await processPartnerInvite(
          message,
          "alianza"
        );
      }

      // -----------------------------------------------
      // AFFYS
      // -----------------------------------------------

      if (
        message.channel.id ===
        data.settings
          .systemChannels
          .affys
      ) {
        await processPartnerInvite(
          message,
          "affy"
        );
      }

      // -----------------------------------------------
      // PREFIX
      // -----------------------------------------------

      if (
        !message.content.startsWith(
          PREFIX
        )
      ) {
        return;
      }

      const args =
        message.content
          .slice(
            PREFIX.length
          )
          .trim()
          .split(/\s+/);

      const command =
        args.shift()
          ?.toLowerCase();

      const valid =
        userCommands.some(
          cmd =>
            cmd.name ===
            command
        );

      if (!valid) {
        return;
      }

      const target =
        message.mentions.users.first();

      let values =
        [...args];

      // -------------------------------------------------
      // CORRECCIÓN IMPORTANTE
      // -------------------------------------------------

      if (
        target &&
        values[0]?.includes(
          target.id
        )
      ) {
        values.shift();
      }

      const stringArgs =
        [...values];

      await executeUserCommand({
        command,

        user:
          message.author,

        guild:
          message.guild,

        member:
          message.member,

        getTarget:
          () => target,

        getInteger:
          index => {
            const value =
              Number(
                values[index]
              );

            return Number.isInteger(
              value
            )
              ? value
              : null;
          },

        getString:
          () =>
            stringArgs.join(
              " "
            ),

        reply:
          payload =>
            message.reply(
              payload
            )
      });

    } catch (error) {

      console.error(
        "User prefix error:",
        error
      );
    }
  }
);

// =====================================================
// READY
// =====================================================

// Discord.js 14/15 compatible
client.once(
  "clientReady",
  async () => {

    console.log(
      `✓ ${client.user.tag} conectado.`
    );

    client.user.setActivity(
      "LRM Studio • .help"
    );

    for (
      const guild
      of client.guilds.cache.values()
    ) {
      await cacheGuildInvites(
        guild
      );
    }

    console.log(
      "✓ Caché de invitaciones cargada."
    );
  }
);

// =====================================================
// NUEVOS SERVIDORES
// =====================================================

client.on(
  "guildCreate",
  async guild => {
    await cacheGuildInvites(
      guild
    );
  }
);

// =====================================================
// ERRORES
// =====================================================

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "Unhandled Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);

// =====================================================
// INICIO
// =====================================================

registerCommands();

client.login(
  TOKEN
);
