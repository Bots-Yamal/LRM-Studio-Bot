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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

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
      fs.readFileSync(DATA_FILE, "utf8")
    );

    parsed.users ??= [];
    parsed.shop ??= [];

    // Corrección por si users viene mal.
    if (Array.isArray(parsed.users)) {
      parsed.users = {};
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

    parsed.ticketSystem ??= {};
    parsed.ticketSystem.panels ??= {};
    parsed.ticketSystem.staffRoles ??= {};
    parsed.ticketSystem.openTickets ??= {};
    parsed.ticketSystem.logs ??= {};

    parsed.ticketSystem.logs.valoraciones ??= null;
    parsed.ticketSystem.logs.transacciones ??= null;
    parsed.ticketSystem.logs.tickets ??= null;

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

  const account = data.users[id];

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

  return account;
}

// =====================================================
// UTILIDADES
// =====================================================

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function money(value) {
  return `$${Math.floor(value).toLocaleString("es-ES")}`;
}

function glassEmbed(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text: "LRM Studio  •  Fluent Glass"
    });
}

function errorEmbed(text) {
  return glassEmbed(COLORS.error)
    .setTitle(`${E.error}  Error`)
    .setDescription(text);
}

function successEmbed(text) {
  return glassEmbed(COLORS.success)
    .setTitle(`${E.success}  Completado`)
    .setDescription(text);
}

function cooldown(account, name, duration) {
  const now = Date.now();
  const last = account.cooldowns[name] || 0;
  const remaining = duration - (now - last);

  if (remaining > 0) {
    return remaining;
  }

  account.cooldowns[name] = now;
  saveData();

  return 0;
}

function addXP(id, amount = random(3, 8)) {
  const account = getUser(id);

  account.xp += amount;

  let leveled = false;

  while (
    account.xp >=
    account.level * 100
  ) {
    account.xp -=
      account.level * 100;

    account.level++;
    leveled = true;
  }

  saveData();

  return leveled;
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
      options.color || COLORS.info
    )
      .setTitle(
        options.title || "Log"
      )
      .setDescription(
        options.description ||
        "Sin información."
      )
      .setTimestamp();

  if (options.fields?.length) {
    logEmbed.addFields(
      options.fields
    );
  }

  await channel.send({
    embeds: [logEmbed]
  }).catch(() => {});
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
  const [a, b, c] = roll;

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

function royaleWarning(userId) {
  const row =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `royale_accept:${userId}`
          )
          .setLabel("Aceptar")
          .setStyle(
            ButtonStyle.Success
          ),

        new ButtonBuilder()
          .setCustomId(
            `royale_reject:${userId}`
          )
          .setLabel("Rechazar")
          .setStyle(
            ButtonStyle.Secondary
          )
      );

  return {
    embeds: [
      glassEmbed(COLORS.royale)
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
    components: [row]
  };
}

async function startRoyale(interaction) {
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
      glassEmbed(COLORS.royale)
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

  // Animación
  for (let i = 0; i < 8; i++) {
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
              `**Girando... ${i + 1}/8**\n\n` +
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

  if (result === "triple") {
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
      `Los 3 símbolos fueron diferentes.\n\n` +
      `Puedes volver a intentarlo después del cooldown.`;
  }

  addXP(
    user.id,
    result === "triple"
      ? 15
      : result === "double"
        ? 8
        : 3
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
          `${royaleText(finalRoll)}\n\n${resultText}\n\n` +
          `**Estadísticas**\n` +
          `Tiradas: **${account.luckRoyale.spins}**\n` +
          `Dobles: **${account.luckRoyale.wins2}**\n` +
          `Triples: **${account.luckRoyale.wins3}**`
        )
    ]
  });
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const userCommands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription(
      "Consulta tu balance."
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
      "Comando de economía con riesgo."
    ),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription(
      "Comando de economía con riesgo."
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
        .setDescription("Mínimo")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("max")
        .setDescription("Máximo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("luckroyale")
    .setDescription(
      "Juega Luck Royale."
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
// REGISTRO
// =====================================================

const commands = [
  ...userCommands,
  ...adminCommands
].map(
  command =>
    command.toJSON()
);

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID) {
    console.error(
      "Falta DISCORD_TOKEN o CLIENT_ID."
    );
    return;
  }

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

setupAdmin(client, {
  data,
  saveData,
  sendLog,
  logAction,
  getUser,
  prefix: PREFIX,
  colors: COLORS,
  symbols: E
});

// =====================================================
// USER COMMAND LOGIC
// =====================================================

async function executeUserCommand(ctx) {
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

  if (command === "luckroyale") {
    return reply(
      royaleWarning(
        user.id
      )
    );
  }

  if (command === "balance") {
    const target =
      getTarget() || user;

    const account =
      getUser(target.id);

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
            `${E.money} Wallet\n**${money(account.wallet)}**\n\n` +
            `${E.bank} Banco\n**${money(account.bank)}**\n\n` +
            `${E.transfer} Total\n**${money(
              account.wallet +
              account.bank
            )}**`
          )
      ]
    });
  }

  if (command === "work") {
    const account =
      getUser(user.id);

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
      random(20, 30);

    account.wallet += reward;

    addXP(user.id);
    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Ganaste **${money(reward)}** trabajando.\n\n` +
          `Wallet: **${money(account.wallet)}**`
        )
      ]
    });
  }

  if (command === "risk") {
    const account =
      getUser(user.id);

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
            `Espera **${Math.ceil(
              remaining / 1000
            )}s**.`
          )
        ]
      });
    }

    const won =
      random(1, 100) <= 30;

    if (won) {
      const reward =
        random(40, 70);

      account.wallet += reward;

      addXP(user.id);
      saveData();

      return reply({
        embeds: [
          successEmbed(
            `Conseguiste **${money(reward)}**.\n\n` +
            `Wallet: **${money(account.wallet)}**`
          )
        ]
      });
    }

    const loss =
      random(50, 100);

    account.wallet -= loss;

    saveData();

    return reply({
      embeds: [
        glassEmbed(COLORS.error)
          .setTitle(
            `${E.loss} Fallaste`
          )
          .setDescription(
            `Perdiste **${money(loss)}**.\n\n` +
            `Wallet: **${money(account.wallet)}**`
          )
      ]
    });
  }

  if (command === "crime") {
    const account =
      getUser(user.id);

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
            `Espera **${Math.ceil(
              remaining / 1000
            )}s**.`
          )
        ]
      });
    }

    const won =
      random(1, 100) <= 20;

    if (won) {
      const reward =
        random(50, 80);

      account.wallet += reward;

      addXP(user.id);
      saveData();

      return reply({
        embeds: [
          successEmbed(
            `Conseguiste **${money(reward)}**.\n\n` +
            `Wallet: **${money(account.wallet)}**`
          )
        ]
      });
    }

    const loss =
      random(70, 200);

    account.wallet -= loss;

    saveData();

    return reply({
      embeds: [
        glassEmbed(COLORS.error)
          .setTitle(
            `${E.loss} Fallaste`
          )
          .setDescription(
            `Perdiste **${money(loss)}**.\n\n` +
            `Wallet: **${money(account.wallet)}**`
          )
      ]
    });
  }

  if (command === "daily") {
    const account =
      getUser(user.id);

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
            `Tu daily todavía no está disponible.`
          )
        ]
      });
    }

    account.wallet += 50;

    addXP(user.id, 5);
    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Recibiste **$50**.\n\nWallet: **${money(account.wallet)}**`
        )
      ]
    });
  }

  if (
    command === "dep" ||
    command === "with"
  ) {
    const amount =
      getInteger(0);

    if (!amount || amount <= 0) {
      return reply({
        embeds: [
          errorEmbed(
            "Indica una cantidad válida."
          )
        ]
      });
    }

    const account =
      getUser(user.id);

    if (command === "dep") {
      if (
        account.wallet < amount
      ) {
        return reply({
          embeds: [
            errorEmbed(
              "No tienes suficiente dinero."
            )
          ]
        });
      }

      account.wallet -= amount;
      account.bank += amount;
    } else {
      if (
        account.bank < amount
      ) {
        return reply({
          embeds: [
            errorEmbed(
              "No tienes suficiente dinero en el banco."
            )
          ]
        });
      }

      account.bank -= amount;
      account.wallet += amount;
    }

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `${E.money} Wallet: **${money(account.wallet)}**\n` +
          `${E.bank} Banco: **${money(account.bank)}**`
        )
      ]
    });
  }

  if (command === "pay") {
    const target =
      getTarget();

    const amount =
      getInteger(1);

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
      target.id === user.id ||
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
      getUser(user.id);

    const receiver =
      getUser(target.id);

    if (
      sender.wallet < amount
    ) {
      return reply({
        embeds: [
          errorEmbed(
            "No tienes suficiente dinero."
          )
        ]
      });
    }

    sender.wallet -= amount;
    receiver.wallet += amount;

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Enviaste **${money(amount)}** a ${target}.`
        )
      ]
    });
  }

  if (command === "profile") {
    const target =
      getTarget() || user;

    const account =
      getUser(target.id);

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
            `${E.money} Wallet: **${money(account.wallet)}**\n` +
            `${E.bank} Banco: **${money(account.bank)}**\n` +
            `${E.level} Nivel: **${account.level}**\n` +
            `XP: **${account.xp}/${account.level * 100}**\n` +
            `${E.inventory} Objetos: **${account.inventory.length}**`
          )
      ]
    });
  }

  if (command === "inventory") {
    const account =
      getUser(user.id);

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
                    (item, index) =>
                      `**${index + 1}.** ${item}`
                  )
                  .join("\n")
              : "Tu inventario está vacío."
          )
      ]
    });
  }

  if (command === "rank") {
    const account =
      getUser(user.id);

    return reply({
      embeds: [
        glassEmbed(COLORS.level)
          .setTitle(
            `${E.level}  Rank`
          )
          .setDescription(
            `Nivel **${account.level}**\n\n` +
            `XP **${account.xp}/${account.level * 100}**`
          )
      ]
    });
  }

  if (command === "shop") {
    return reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(
            `${E.shop}  Tienda`
          )
          .setDescription(
            data.shop.length
              ? data.shop
                  .map(
                    (item, index) =>
                      `**${index + 1}. ${item.name}**\n${money(item.price)}`
                  )
                  .join("\n\n")
              : "La tienda está vacía."
          )
      ]
    });
  }

  if (command === "buy") {
    const productName =
      getString();

    const product =
      data.shop.find(
        item =>
          item.name.toLowerCase() ===
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
      getUser(user.id);

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

    account.wallet -=
      product.price;

    if (
      product.type === "role" &&
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

      await member.roles
        .add(role)
        .catch(() => {});
    } else {
      account.inventory.push(
        product.name
      );
    }

    saveData();

    return reply({
      embeds: [
        successEmbed(
          `Compraste **${product.name}** por **${money(product.price)}**.`
        )
      ]
    });
  }

  if (command === "use") {
    const itemName =
      getString();

    const account =
      getUser(user.id);

    const index =
      account.inventory
        .findIndex(
          item =>
            item.toLowerCase() ===
            itemName?.toLowerCase()
        );

    if (index === -1) {
      return reply({
        embeds: [
          errorEmbed(
            "No tienes ese objeto."
          )
        ]
      });
    }

    const item =
      account.inventory[index];

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

  if (command === "baltop") {
    const top =
      Object.entries(
        data.users
      )
        .sort(
          (a, b) =>
            (
              b[1].wallet +
              b[1].bank
            ) -
            (
              a[1].wallet +
              a[1].bank
            )
        )
        .slice(0, 10);

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
              ? top.map(
                  ([id, account], index) =>
                    `**${index + 1}.** <@${id}> • **${money(
                      account.wallet +
                      account.bank
                    )}**`
                ).join("\n")
              : "No hay datos."
          )
      ]
    });
  }

  if (command === "leveltop") {
    const top =
      Object.entries(
        data.users
      )
        .sort(
          (a, b) =>
            b[1].level -
            a[1].level
        )
        .slice(0, 10);

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
              ? top.map(
                  ([id, account], index) =>
                    `**${index + 1}.** <@${id}> • Nivel **${account.level}**`
                ).join("\n")
              : "No hay datos."
          )
      ]
    });
  }

  if (command === "coinflip") {
    return reply({
      embeds: [
        glassEmbed(
          COLORS.info
        )
          .setTitle(
            `${E.random}  Coinflip`
          )
          .setDescription(
            Math.random() < 0.5
              ? "**Cara**"
              : "**Cruz**"
          )
      ]
    });
  }

  if (command === "8ball") {
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
            `**Respuesta**\n${answers[random(0, answers.length - 1)]}`
          )
      ]
    });
  }

  if (command === "random") {
    const min =
      getInteger(0);

    const max =
      getInteger(1);

    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
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
            `Resultado: **${random(min, max)}**`
          )
      ]
    });
  }

  if (command === "ping") {
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

  if (command === "botinfo") {
    return reply({
      embeds: [
        glassEmbed()
          .setTitle(
            `${E.info}  LRM Studio`
          )
          .setDescription(
            `Servidores: **${client.guilds.cache.size}**\n` +
            `Usuarios: **${client.users.cache.size}**\n` +
            `Prefix: **.** + **/**\n` +
            `Node: **${process.version}**`
          )
      ]
    });
  }

  if (command === "serverinfo") {
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

  if (command === "userinfo") {
    const target =
      getTarget() || user;

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

  if (command === "avatar") {
    const target =
      getTarget() || user;

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
      // BOTONES LUCK ROYALE
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
              ephemeral: true
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
              ephemeral: true
            });
          }

          return startRoyale(
            interaction
          );
        }

        return;
      }

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
        interaction.options
          .getUser("usuario");

      let integerValues = [];

      if (
        command === "dep" ||
        command === "with"
      ) {
        integerValues = [
          interaction.options
            .getInteger(
              "cantidad"
            )
        ];
      }

      if (command === "pay") {
        integerValues = [
          null,
          interaction.options
            .getInteger(
              "cantidad"
            )
        ];
      }

      if (
        command === "random"
      ) {
        integerValues = [
          interaction.options
            .getInteger("min"),
          interaction.options
            .getInteger("max")
        ];
      }

      let stringValue = null;

      if (command === "buy") {
        stringValue =
          interaction.options
            .getString(
              "producto"
            );
      }

      if (command === "use") {
        stringValue =
          interaction.options
            .getString(
              "objeto"
            );
      }

      if (
        command === "8ball"
      ) {
        stringValue =
          interaction.options
            .getString(
              "pregunta"
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
            integerValues[index],

        getString:
          () => stringValue,

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
    }
  }
);

// =====================================================
// PREFIX
// =====================================================

client.on(
  "messageCreate",
  async message => {
    if (
      message.author.bot ||
      !message.guild ||
      !message.content.startsWith(
        PREFIX
      )
    ) {
      return;
    }

    const args =
      message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const command =
      args.shift()
        ?.toLowerCase();

    const valid =
      userCommands.some(
        cmd =>
          cmd.name === command
      );

    if (!valid) return;

    const target =
      message.mentions.users.first();

    let stringArgs = [...args];

    if (
      target &&
      stringArgs[0]?.includes(
        target.id
      )
    ) {
      stringArgs.shift();
    }

    return executeUserCommand({
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
          let values = [...args];

          if (
            target &&
            values[0]?.includes(
              target.id
            )
          ) {
            values.shift();
          }

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
          stringArgs.join(" "),

      reply:
        payload =>
          message.reply(payload)
    });
  }
);

// =====================================================
// READY
// =====================================================

client.once(
  "ready",
  () => {
    console.log(
      `✓ ${client.user.tag} conectado.`
    );

    client.user.setActivity(
      "LRM Studio • .help"
    );
  }
);

process.on(
  "unhandledRejection",
  console.error
);

process.on(
  "uncaughtException",
  console.error
);

registerCommands();
client.login(TOKEN);
