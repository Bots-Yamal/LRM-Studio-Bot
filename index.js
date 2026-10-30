const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const fs = require("fs");

const {
  setupAdmin,
  adminCommands
} = require("./admin");

// =====================================================
// LRM STUDIO BOT
// INDEX PRINCIPAL
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const PREFIX = ".";
const COLOR = "#FF8A00";
const DATA_FILE = "./data.json";

// =====================================================
// EMOJIS
// =====================================================

const EMOJIS = {
  feliz: {
    name: "feliz",
    id: "1543374186540568586",
    animated: false
  },

  triste: {
    name: "llorando",
    id: "1543373946383114332",
    animated: false
  },

  alerta: {
    name: "alerta",
    id: "1563019834495606824",
    animated: false
  },

  no: {
    name: "no",
    id: "1543374123714089122",
    animated: false
  },

  dinero: {
    name: "dinero",
    id: "1563019819639640266",
    animated: false
  },

  ojo: {
    name: "emoji_20",
    id: "1557625884461109348",
    animated: false
  },

  prohibido: {
    name: "prohibido",
    id: "1543374036149477428",
    animated: false
  },

  idea: {
    name: "idea",
    id: "1543374116176928859",
    animated: false
  },

  reloj: {
    name: "reloj",
    id: "1543374030713790515",
    animated: false
  },

  estrella: {
    name: "estrella",
    id: "1543374328140144742",
    animated: false
  }
};

const EMOJI_ID = Object.fromEntries(
  Object.entries(EMOJIS).map(
    ([key, value]) => [key, value.id]
  )
);

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================================================
// EMOJI HELPER
// =====================================================

function getEmoji(key) {
  const emoji = EMOJIS[key];

  if (!emoji) {
    return "";
  }

  // Si Discord tiene el emoji en caché,
  // usamos el objeto real.
  const cached =
    client.emojis.cache.get(emoji.id);

  if (cached) {
    return cached.toString();
  }

  // Fallback directo mediante ID.
  return emoji.animated
    ? `<a:${emoji.name}:${emoji.id}>`
    : `<:${emoji.name}:${emoji.id}>`;
}

const E = new Proxy(
  {},
  {
    get(target, property) {
      return getEmoji(property);
    }
  }
);

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
  }
};

function cloneDefaultData() {
  return JSON.parse(
    JSON.stringify(DEFAULT_DATA)
  );
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const fresh = cloneDefaultData();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(fresh, null, 2)
    );

    return fresh;
  }

  try {
    const raw =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      );

    const parsed =
      JSON.parse(raw);

    parsed.users ??= {};
    parsed.shop ??= [];
    parsed.settings ??= {};
    parsed.settings.logs ??= {};

    parsed.settings.logs.general ??= null;
    parsed.settings.logs.economia ??= null;
    parsed.settings.logs.tienda ??= null;
    parsed.settings.logs.niveles ??= null;
    parsed.settings.logs.admin ??= null;

    return parsed;

  } catch (error) {
    console.error(
      "Error leyendo data.json:",
      error
    );

    return cloneDefaultData();
  }
}

let data = loadData();

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
      cooldowns: {}
    };

    saveData();
  }

  return data.users[id];
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

function money(amount) {
  return Number(amount)
    .toLocaleString("es-ES");
}

function errorEmbed(text) {
  return new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle(
      `${E.no} Ha ocurrido un problema`
    )
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot"
    });
}

function successEmbed(text) {
  return new EmbedBuilder()
    .setColor("#57F287")
    .setTitle(
      `${E.feliz} Completado`
    )
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot"
    });
}

// =====================================================
// LOG SYSTEM
// =====================================================

function getLogs() {
  data.settings ??= {};
  data.settings.logs ??= {};

  data.settings.logs.general ??= null;
  data.settings.logs.economia ??= null;
  data.settings.logs.tienda ??= null;
  data.settings.logs.niveles ??= null;
  data.settings.logs.admin ??= null;

  return data.settings.logs;
}

function truncate(text, max = 1000) {
  if (!text) {
    return "*Sin contenido*";
  }

  text = String(text);

  if (text.length <= max) {
    return text;
  }

  return (
    text.slice(0, max - 3) +
    "..."
  );
}

async function sendLog(
  guild,
  type,
  {
    title,
    description,
    color = COLOR,
    user = null,
    fields = []
  } = {}
) {
  if (!guild) {
    return;
  }

  const logs = getLogs();

  const channelId =
    logs[type];

  if (!channelId) {
    return;
  }

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    return;
  }

  const embed =
    new EmbedBuilder()
      .setColor(color)
      .setTitle(
        title ||
          `${E.idea} LRM Studio • Log`
      )
      .setDescription(
        description ||
          "Sin información."
      )
      .setTimestamp()
      .setFooter({
        text:
          `LRM Studio Bot • ${type}`
      });

  if (user) {
    embed.setAuthor({
      name:
        user.tag ||
        user.username ||
        "Usuario",
      iconURL:
        user.displayAvatarURL?.()
    });
  }

  if (fields.length) {
    embed.addFields(fields);
  }

  try {
    await channel.send({
      embeds: [embed]
    });
  } catch (error) {
    console.error(
      `Error enviando log ${type}:`,
      error
    );
  }
}

async function sendAllLogs(
  guild,
  options
) {
  await sendLog(
    guild,
    "general",
    options
  );
}

function logAction(
  guild,
  type,
  options
) {
  sendLog(
    guild,
    type,
    options
  ).catch(console.error);

  if (type !== "general") {
    sendLog(
      guild,
      "general",
      options
    ).catch(console.error);
  }
}

// =====================================================
// COOLDOWNS
// =====================================================

function checkCooldown(
  user,
  command,
  duration
) {
  const last =
    user.cooldowns[command] || 0;

  const elapsed =
    Date.now() - last;

  if (elapsed < duration) {
    return duration - elapsed;
  }

  return 0;
}

function setCooldown(
  user,
  command
) {
  user.cooldowns[command] =
    Date.now();

  saveData();
}

function formatTime(ms) {
  let seconds =
    Math.ceil(ms / 1000);

  const hours =
    Math.floor(
      seconds / 3600
    );

  seconds %= 3600;

  const minutes =
    Math.floor(
      seconds / 60
    );

  seconds %= 60;

  const parts = [];

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (minutes) {
    parts.push(`${minutes}m`);
  }

  if (seconds) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

function cooldownEmbed(ms) {
  return new EmbedBuilder()
    .setColor("#FEE75C")
    .setTitle(
      `${E.reloj} Comando en cooldown`
    )
    .setDescription(
      `Todavía no puedes volver a utilizar este comando.\n\n` +
      `${E.reloj} Tiempo restante: **${formatTime(ms)}**`
    )
    .setFooter({
      text: "LRM Studio Bot"
    });
}

// =====================================================
// XP
// =====================================================

function addXP(id) {
  const user =
    getUser(id);

  const gained =
    random(3, 8);

  user.xp += gained;

  const required =
    user.level * 100;

  let levelUp = false;

  if (
    user.xp >= required
  ) {
    user.xp -= required;
    user.level++;
    levelUp = true;
  }

  saveData();

  return {
    gained,
    levelUp,
    level: user.level
  };
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const userCommands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Consulta tu balance.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription(
          "Usuario que quieres consultar."
        )
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("work")
    .setDescription(
      "Trabaja para conseguir monedas."
    ),

  new SlashCommandBuilder()
    .setName("risk")
    .setDescription(
      "Realiza una acción económica de riesgo."
    ),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription(
      "Realiza un crimen ficticio."
    ),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription(
      "Recoge tu recompensa diaria."
    ),

  new SlashCommandBuilder()
    .setName("dep")
    .setDescription(
      "Deposita dinero en el banco."
    )
    .addStringOption(option =>
      option
        .setName("cantidad")
        .setDescription(
          "Cantidad o all."
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("with")
    .setDescription(
      "Retira dinero del banco."
    )
    .addStringOption(option =>
      option
        .setName("cantidad")
        .setDescription(
          "Cantidad o all."
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription(
      "Envía dinero a otro usuario."
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription(
          "Usuario que recibirá el dinero."
        )
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription(
          "Cantidad de monedas."
        )
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription(
      "Consulta tu perfil."
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription(
          "Usuario que quieres consultar."
        )
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription(
      "Consulta tu inventario."
    ),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription(
      "Consulta tu nivel."
    ),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription(
      "Consulta la tienda."
    ),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription(
      "Compra un producto."
    )
    .addStringOption(option =>
      option
        .setName("producto")
        .setDescription(
          "Producto que quieres comprar."
        )
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription(
      "Utiliza un objeto."
    )
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription(
          "Objeto que quieres utilizar."
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("baltop")
    .setDescription(
      "Ranking de usuarios con más dinero."
    ),

  new SlashCommandBuilder()
    .setName("leveltop")
    .setDescription(
      "Ranking de niveles."
    ),

  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription(
      "Lanza una moneda sin apostar."
    ),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription(
      "Pregúntale algo a la bola mágica."
    )
    .addStringOption(option =>
      option
        .setName("pregunta")
        .setDescription(
          "Tu pregunta."
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("random")
    .setDescription(
      "Genera un número aleatorio."
    )
    .addIntegerOption(option =>
      option
        .setName("minimo")
        .setDescription(
          "Número mínimo."
        )
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("maximo")
        .setDescription(
          "Número máximo."
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Consulta la latencia."
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
      "Información de un usuario."
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(
      "Consulta el avatar."
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    )
];

const commands = [
  ...userCommands,
  ...adminCommands
].map(command =>
  command.toJSON()
);

// =====================================================
// REGISTRAR SLASH COMMANDS
// =====================================================

async function registerCommands() {
  if (!TOKEN) {
    console.error(
      "Falta DISCORD_TOKEN."
    );
    return;
  }

  if (!CLIENT_ID) {
    console.error(
      "Falta CLIENT_ID."
    );
    return;
  }

  const rest =
    new REST({
      version: "10"
    }).setToken(TOKEN);

  try {
    console.log(
      "Registrando comandos slash..."
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
      `Comandos registrados: ${commands.length}`
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
    getEmoji,
    EMOJI_ID,
    sendLog,
    logAction,
    prefix: PREFIX
  }
);

// =====================================================
// READY
// =====================================================

client.once(
  "ready",
  () => {
    console.log(
      "================================="
    );

    console.log(
      "       LRM STUDIO BOT"
    );

    console.log(
      `Conectado como ${client.user.tag}`
    );

    console.log(
      `Prefix: ${PREFIX}`
    );

    console.log(
      "================================="
    );

    client.user.setActivity(
      "LRM Studio ✨"
    );

    console.log(
      "Emojis personalizados:"
    );

    for (
      const [key, emoji] of
      Object.entries(EMOJIS)
    ) {
      const cached =
        client.emojis.cache.get(
          emoji.id
        );

      console.log(
        `${key}: ${
          cached
            ? cached.toString()
            : `<:${emoji.name}:${emoji.id}>`
        }`
      );
    }
  }
);

// =====================================================
// LOGS AUTOMÁTICOS DEL SERVIDOR
// =====================================================

// MENSAJE ELIMINADO
client.on(
  "messageDelete",
  async message => {
    if (!message.guild) return;
    if (message.author?.bot) return;

    logAction(
      message.guild,
      "general",
      {
        title:
          `${E.no} Mensaje eliminado`,
        description:
          `${E.ojo} **Autor:** ${message.author || "Desconocido"}\n` +
          `${E.estrella} **Canal:** ${message.channel}\n\n` +
          `${E.triste} **Contenido:**\n` +
          truncate(
            message.content ||
              "*No disponible*"
          ),
        color: "#ED4245",
        user:
          message.author
      }
    );
  }
);

// MENSAJE EDITADO
client.on(
  "messageUpdate",
  async (oldMessage, newMessage) => {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    if (
      oldMessage.content ===
      newMessage.content
    ) {
      return;
    }

    logAction(
      newMessage.guild,
      "general",
      {
        title:
          `${E.idea} Mensaje editado`,
        description:
          `${E.ojo} **Usuario:** ${newMessage.author}\n` +
          `${E.estrella} **Canal:** ${newMessage.channel}\n\n` +
          `**Antes:**\n${truncate(
            oldMessage.content ||
              "*Sin contenido*"
          )}\n\n` +
          `**Después:**\n${truncate(
            newMessage.content ||
              "*Sin contenido*"
          )}`,
        color: "#FEE75C",
        user:
          newMessage.author
      }
    );
  }
);

// MIEMBRO ENTRA
client.on(
  "guildMemberAdd",
  member => {
    logAction(
      member.guild,
      "general",
      {
        title:
          `${E.feliz} Usuario entró`,
        description:
          `${member} **${member.user.tag}** entró al servidor.\n\n` +
          `${E.idea} ID: **${member.id}**`,
        color: "#57F287",
        user: member.user
      }
    );
  }
);

// MIEMBRO SALE
client.on(
  "guildMemberRemove",
  member => {
    logAction(
      member.guild,
      "general",
      {
        title:
          `${E.triste} Usuario salió`,
        description:
          `**${member.user.tag}** abandonó el servidor.\n\n` +
          `${E.idea} ID: **${member.id}**`,
        color: "#ED4245",
        user: member.user
      }
    );
  }
);

// ROL CREADO
client.on(
  "roleCreate",
  role => {
    logAction(
      role.guild,
      "general",
      {
        title:
          `${E.feliz} Rol creado`,
        description:
          `${E.estrella} Se creó el rol ${role}.\n\n` +
          `${E.idea} ID: **${role.id}**`,
        color: "#57F287"
      }
    );
  }
);

// ROL ELIMINADO
client.on(
  "roleDelete",
  role => {
    logAction(
      role.guild,
      "general",
      {
        title:
          `${E.no} Rol eliminado`,
        description:
          `${E.triste} Se eliminó el rol **${role.name}**.\n\n` +
          `${E.idea} ID: **${role.id}**`,
        color: "#ED4245"
      }
    );
  }
);

// ROL MODIFICADO
client.on(
  "roleUpdate",
  (oldRole, newRole) => {
    const changes = [];

    if (
      oldRole.name !==
      newRole.name
    ) {
      changes.push(
        `**Nombre:** \`${oldRole.name}\` → \`${newRole.name}\``
      );
    }

    if (
      oldRole.hexColor !==
      newRole.hexColor
    ) {
      changes.push(
        `**Color:** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``
      );
    }

    if (
      oldRole.permissions.bitfield !==
      newRole.permissions.bitfield
    ) {
      changes.push(
        `**Permisos:** modificados`
      );
    }

    if (!changes.length) {
      return;
    }

    logAction(
      newRole.guild,
      "general",
      {
        title:
          `${E.idea} Rol modificado`,
        description:
          `${E.estrella} Rol: ${newRole}\n\n` +
          changes.join("\n"),
        color: "#FEE75C"
      }
    );
  }
);

// CANAL CREADO
client.on(
  "channelCreate",
  channel => {
    if (!channel.guild) return;

    logAction(
      channel.guild,
      "general",
      {
        title:
          `${E.feliz} Canal creado`,
        description:
          `${E.estrella} Se creó ${channel}.\n\n` +
          `${E.idea} Nombre: **${channel.name}**\n` +
          `${E.idea} Tipo: **${channel.type}**`,
        color: "#57F287"
      }
    );
  }
);

// CANAL ELIMINADO
client.on(
  "channelDelete",
  channel => {
    if (!channel.guild) return;

    logAction(
      channel.guild,
      "general",
      {
        title:
          `${E.no} Canal eliminado`,
        description:
          `${E.triste} Se eliminó el canal **${channel.name}**.\n\n` +
          `${E.idea} ID: **${channel.id}**`,
        color: "#ED4245"
      }
    );
  }
);

// CANAL MODIFICADO
client.on(
  "channelUpdate",
  (oldChannel, newChannel) => {
    if (!newChannel.guild) {
      return;
    }

    const changes = [];

    if (
      oldChannel.name !==
      newChannel.name
    ) {
      changes.push(
        `**Nombre:** \`${oldChannel.name}\` → \`${newChannel.name}\``
      );
    }

    if (
      oldChannel.topic !==
      newChannel.topic
    ) {
      changes.push(
        `**Tema:** modificado`
      );
    }

    if (
      oldChannel.parentId !==
      newChannel.parentId
    ) {
      changes.push(
        `**Categoría:** modificada`
      );
    }

    if (!changes.length) {
      return;
    }

    logAction(
      newChannel.guild,
      "general",
      {
        title:
          `${E.idea} Canal modificado`,
        description:
          `${E.ojo} Canal: ${newChannel}\n\n` +
          changes.join("\n"),
        color: "#FEE75C"
      }
    );
  }
);

// SERVIDOR MODIFICADO
client.on(
  "guildUpdate",
  (oldGuild, newGuild) => {
    const changes = [];

    if (
      oldGuild.name !==
      newGuild.name
    ) {
      changes.push(
        `**Nombre:** \`${oldGuild.name}\` → \`${newGuild.name}\``
      );
    }

    if (
      oldGuild.description !==
      newGuild.description
    ) {
      changes.push(
        `**Descripción:** modificada`
      );
    }

    if (
      oldGuild.icon !==
      newGuild.icon
    ) {
      changes.push(
        `**Icono:** modificado`
      );
    }

    if (!changes.length) {
      return;
    }

    logAction(
      newGuild,
      "general",
      {
        title:
          `${E.alerta} Servidor modificado`,
        description:
          changes.join("\n"),
        color: "#FEE75C"
      }
    );
  }
);

// =====================================================
// PREFIX COMMANDS
// =====================================================

client.on(
  "messageCreate",
  async message => {
    if (message.author.bot) {
      return;
    }

    if (!message.guild) {
      return;
    }

    if (
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
        .split(/ +/);

    const command =
      args.shift()?.toLowerCase();

    if (!command) {
      return;
    }

    // ===============================================
    // .help
    // ===============================================

    if (
      command === "help"
    ) {
      const embed =
        new EmbedBuilder()
          .setColor(COLOR)
          .setTitle(
            `${E.estrella} LRM Studio Bot`
          )
          .setThumbnail(
            client.user.displayAvatarURL()
          )
          .setDescription(
            `${E.feliz} **¡Bienvenido al menú de ayuda!**\n\n` +
            `Selecciona una categoría en el menú inferior.\n\n` +
            `${E.dinero} **Economía**\n` +
            `${E.estrella} **Perfil**\n` +
            `${E.dinero} **Tienda**\n` +
            `${E.estrella} **Rankings**\n` +
            `${E.feliz} **Diversión**\n` +
            `${E.idea} **Información**\n\n` +
            `${E.idea} Los comandos administrativos están en **.admin**.`
          )
          .setFooter({
            text:
              "LRM Studio Bot • Help"
          });

      const menu =
        new StringSelectMenuBuilder()
          .setCustomId(
            "lrm_help_menu"
          )
          .setPlaceholder(
            "Selecciona una categoría"
          )
          .addOptions(
            {
              label: "Economía",
              description:
                "Dinero, banco y trabajos.",
              value: "economia",
              emoji: {
                id: EMOJI_ID.dinero,
                name:
                  EMOJIS.dinero.name
              }
            },
            {
              label: "Perfil",
              description:
                "Perfil, inventario y niveles.",
              value: "perfil",
              emoji: {
                id: EMOJI_ID.estrella,
                name:
                  EMOJIS.estrella.name
              }
            },
            {
              label: "Tienda",
              description:
                "Compra productos y roles.",
              value: "tienda",
              emoji: {
                id: EMOJI_ID.dinero,
                name:
                  EMOJIS.dinero.name
              }
            },
            {
              label: "Rankings",
              description:
                "Consulta los mejores usuarios.",
              value: "rankings",
              emoji: {
                id: EMOJI_ID.estrella,
                name:
                  EMOJIS.estrella.name
              }
            },
            {
              label: "Diversión",
              description:
                "Comandos para pasar el rato.",
              value: "diversion",
              emoji: {
                id: EMOJI_ID.feliz,
                name:
                  EMOJIS.feliz.name
              }
            },
            {
              label: "Información",
              description:
                "Información del bot y servidor.",
              value: "informacion",
              emoji: {
                id: EMOJI_ID.idea,
                name:
                  EMOJIS.idea.name
              }
            }
          );

      return message.reply({
        embeds: [embed],
        components: [
          new ActionRowBuilder()
            .addComponents(menu)
        ]
      });
    }

    // .setlog y .logs están en admin.js
  }
);

// =====================================================
// INTERACTIONS
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    // ===============================================
    // AUTOCOMPLETE
    // ===============================================

    if (
      interaction.isAutocomplete()
    ) {
      if (
        interaction.commandName ===
        "buy"
      ) {
        const focused =
          interaction.options
            .getFocused()
            .toLowerCase();

        const results =
          data.shop
            .filter(product =>
              product.name
                .toLowerCase()
                .includes(focused)
            )
            .slice(0, 25);

        return interaction.respond(
          results.map(product => ({
            name:
              `${product.name} • ` +
              `${money(product.price)} monedas`,
            value:
              product.name
          }))
        );
      }

      return;
    }

    // ===============================================
    // HELP MENU
    // ===============================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId ===
        "lrm_help_menu"
    ) {
      const category =
        interaction.values[0];

      const embed =
        new EmbedBuilder()
          .setColor(COLOR)
          .setFooter({
            text:
              "LRM Studio Bot • Help"
          });

      if (
        category === "economia"
      ) {
        embed
          .setTitle(
            `${E.dinero} Economía`
          )
          .setDescription(
            `${E.dinero} **/balance** — Consulta tu dinero.\n\n` +
            `${E.feliz} **/work** — Gana 20-30 monedas cada 30 segundos.\n\n` +
            `${E.alerta} **/risk** — Acción económica de riesgo.\n\n` +
            `${E.alerta} **/crime** — Acción económica de riesgo.\n\n` +
            `${E.estrella} **/daily** — 50 monedas cada 24 horas.\n\n` +
            `${E.dinero} **/dep** — Deposita dinero.\n\n` +
            `${E.dinero} **/with** — Retira dinero.\n\n` +
            `${E.dinero} **/pay** — Envía monedas.`
          );
      }

      if (
        category === "perfil"
      ) {
        embed
          .setTitle(
            `${E.estrella} Perfil`
          )
          .setDescription(
            `${E.ojo} **/profile** — Consulta un perfil.\n\n` +
            `${E.dinero} **/balance** — Consulta el balance.\n\n` +
            `${E.estrella} **/rank** — Consulta nivel y XP.\n\n` +
            `${E.idea} **/inventory** — Consulta tus objetos.`
          );
      }

      if (
        category === "tienda"
      ) {
        embed
          .setTitle(
            `${E.dinero} Tienda`
          )
          .setDescription(
            `${E.ojo} **/shop** — Abre la tienda.\n\n` +
            `${E.dinero} **/buy** — Compra un producto.\n\n` +
            `${E.estrella} **/use** — Utiliza un objeto.`
          );
      }

      if (
        category === "rankings"
      ) {
        embed
          .setTitle(
            `${E.estrella} Rankings`
          )
          .setDescription(
            `${E.dinero} **/baltop** — Ranking económico.\n\n` +
            `${E.estrella} **/leveltop** — Ranking de niveles.`
          );
      }

      if (
        category === "diversion"
      ) {
        embed
          .setTitle(
            `${E.feliz} Diversión`
          )
          .setDescription(
            `${E.feliz} **/coinflip** — Cara o cruz.\n\n` +
            `${E.idea} **/8ball** — Bola mágica.\n\n` +
            `${E.estrella} **/random** — Número aleatorio.`
          );
      }

      if (
        category ===
        "informacion"
      ) {
        embed
          .setTitle(
            `${E.idea} Información`
          )
          .setDescription(
            `${E.reloj} **/ping** — Latencia.\n\n` +
            `${E.idea} **/botinfo** — Información del bot.\n\n` +
            `${E.ojo} **/serverinfo** — Información del servidor.\n\n` +
            `${E.ojo} **/userinfo** — Información de usuarios.\n\n` +
            `${E.estrella} **/avatar** — Consulta avatares.`
          );
      }

      return interaction.update({
        embeds: [embed]
      });
    }

    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const command =
      interaction.commandName;

    // ===============================================
    // BALANCE
    // ===============================================

    if (
      command === "balance"
    ) {
      const target =
        interaction.options.getUser(
          "usuario"
        ) ||
        interaction.user;

      const user =
        getUser(target.id);

      const total =
        user.wallet +
        user.bank;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.dinero} Balance de ${target.username}`
            )
            .setThumbnail(
              target.displayAvatarURL()
            )
            .addFields(
              {
                name:
                  `${E.dinero} Efectivo`,
                value:
                  `**${money(user.wallet)}**`,
                inline: true
              },
              {
                name:
                  `${E.estrella} Banco`,
                value:
                  `**${money(user.bank)}**`,
                inline: true
              },
              {
                name:
                  `${E.dinero} Patrimonio`,
                value:
                  `**${money(total)}**`,
                inline: false
              }
            )
        ]
      });
    }

    // ===============================================
    // WORK
    // ===============================================

    if (
      command === "work"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const cooldown =
        checkCooldown(
          user,
          "work",
          30000
        );

      if (cooldown) {
        return interaction.reply({
          embeds: [
            cooldownEmbed(
              cooldown
            )
          ],
          ephemeral: true
        });
      }

      const amount =
        random(20, 30);

      user.wallet += amount;

      setCooldown(
        user,
        "work"
      );

      const xp =
        addXP(
          interaction.user.id
        );

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.dinero} Work`,
          description:
            `${interaction.user} trabajó.\n\n` +
            `${E.dinero} Ganó: **${money(amount)} monedas**`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      if (xp.levelUp) {
        logAction(
          interaction.guild,
          "niveles",
          {
            title:
              `${E.estrella} Subida de nivel`,
            description:
              `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
            color: "#FFD700",
            user:
              interaction.user
          }
        );
      }

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Ganaste **${amount} monedas**.\n\n` +
            `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
          )
        ]
      });
    }

    // ===============================================
    // RISK
    // ===============================================

    if (
      command === "risk"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const cooldown =
        checkCooldown(
          user,
          "risk",
          60000
        );

      if (cooldown) {
        return interaction.reply({
          embeds: [
            cooldownEmbed(
              cooldown
            )
          ],
          ephemeral: true
        });
      }

      setCooldown(
        user,
        "risk"
      );

      const loses =
        Math.random() < 0.70;

      if (loses) {
        const amount =
          random(50, 100);

        user.wallet -= amount;

        saveData();

        logAction(
          interaction.guild,
          "economia",
          {
            title:
              `${E.triste} Acción económica fallida`,
            description:
              `${interaction.user} perdió dinero.\n\n` +
              `${E.dinero} Penalización: **-${amount} monedas**`,
            color: "#ED4245",
            user:
              interaction.user
          }
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.triste} Salió mal`
              )
              .setDescription(
                `${E.triste} Penalización: **-${amount} monedas**\n\n` +
                `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
              )
          ]
        });
      }

      const amount =
        random(40, 70);

      user.wallet += amount;

      const xp =
        addXP(
          interaction.user.id
        );

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.feliz} Acción económica`,
          description:
            `${interaction.user} ganó **${amount} monedas**.`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      if (xp.levelUp) {
        logAction(
          interaction.guild,
          "niveles",
          {
            title:
              `${E.estrella} Subida de nivel`,
            description:
              `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
            color: "#FFD700",
            user:
              interaction.user
          }
        );
      }

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Ganaste **${amount} monedas**.\n\n` +
            `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
          )
        ]
      });
    }

    // ===============================================
    // CRIME
    // ===============================================

    if (
      command === "crime"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const cooldown =
        checkCooldown(
          user,
          "crime",
          120000
        );

      if (cooldown) {
        return interaction.reply({
          embeds: [
            cooldownEmbed(
              cooldown
            )
          ],
          ephemeral: true
        });
      }

      setCooldown(
        user,
        "crime"
      );

      const loses =
        Math.random() < 0.80;

      if (loses) {
        const amount =
          random(70, 200);

        user.wallet -= amount;

        saveData();

        logAction(
          interaction.guild,
          "economia",
          {
            title:
              `${E.alerta} Crime fallido`,
            description:
              `${interaction.user} recibió una multa de **${amount} monedas**.`,
            color: "#ED4245",
            user:
              interaction.user
          }
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.alerta} La acción salió mal`
              )
              .setDescription(
                `${E.triste} Multa: **-${amount} monedas**\n\n` +
                `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
              )
          ]
        });
      }

      const amount =
        random(50, 80);

      user.wallet += amount;

      const xp =
        addXP(
          interaction.user.id
        );

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.feliz} Crime completado`,
          description:
            `${interaction.user} ganó **${amount} monedas**.`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      if (xp.levelUp) {
        logAction(
          interaction.guild,
          "niveles",
          {
            title:
              `${E.estrella} Subida de nivel`,
            description:
              `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
            color: "#FFD700",
            user:
              interaction.user
          }
        );
      }

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Ganaste **${amount} monedas**.\n\n` +
            `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
          )
        ]
      });
    }

    // ===============================================
    // DAILY
    // ===============================================

    if (
      command === "daily"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const cooldown =
        checkCooldown(
          user,
          "daily",
          86400000
        );

      if (cooldown) {
        return interaction.reply({
          embeds: [
            cooldownEmbed(
              cooldown
            )
          ],
          ephemeral: true
        });
      }

      user.wallet += 50;

      setCooldown(
        user,
        "daily"
      );

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.estrella} Daily`,
          description:
            `${interaction.user} recibió **50 monedas**.`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.feliz} Recibiste **50 monedas**.\n\n` +
            `${E.reloj} Próxima recompensa en **24 horas**.`
          )
        ]
      });
    }

    // ===============================================
    // DEP
    // ===============================================

    if (
      command === "dep"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const input =
        interaction.options
          .getString(
            "cantidad"
          )
          .trim()
          .toLowerCase();

      if (user.wallet <= 0) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.dinero} No tienes efectivo positivo para depositar.`
            )
          ],
          ephemeral: true
        });
      }

      const amount =
        input === "all"
          ? user.wallet
          : Number(input);

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.idea} Introduce una cantidad válida o **all**.`
            )
          ],
          ephemeral: true
        });
      }

      if (
        amount > user.wallet
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes suficientes monedas.`
            )
          ],
          ephemeral: true
        });
      }

      user.wallet -= amount;
      user.bank += amount;

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.dinero} Depósito`,
          description:
            `${interaction.user} depositó **${money(amount)} monedas**.`,
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Depositaste **${money(amount)} monedas**.\n\n` +
            `${E.dinero} Efectivo: **${money(user.wallet)}**\n` +
            `${E.estrella} Banco: **${money(user.bank)}**`
          )
        ]
      });
    }

    // ===============================================
    // WITH
    // ===============================================

    if (
      command === "with"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      const input =
        interaction.options
          .getString(
            "cantidad"
          )
          .trim()
          .toLowerCase();

      const amount =
        input === "all"
          ? user.bank
          : Number(input);

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.idea} Introduce una cantidad válida o **all**.`
            )
          ],
          ephemeral: true
        });
      }

      if (
        amount > user.bank
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes suficiente dinero en el banco.`
            )
          ],
          ephemeral: true
        });
      }

      user.bank -= amount;
      user.wallet += amount;

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.dinero} Retiro`,
          description:
            `${interaction.user} retiró **${money(amount)} monedas**.`,
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Retiraste **${money(amount)} monedas**.\n\n` +
            `${E.dinero} Efectivo: **${money(user.wallet)}**\n` +
            `${E.estrella} Banco: **${money(user.bank)}**`
          )
        ]
      });
    }

    // ===============================================
    // PAY
    // ===============================================

    if (
      command === "pay"
    ) {
      const target =
        interaction.options.getUser(
          "usuario"
        );

      const amount =
        interaction.options.getInteger(
          "cantidad"
        );

      if (target.bot) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No puedes enviar monedas a un bot.`
            )
          ],
          ephemeral: true
        });
      }

      if (
        target.id ===
        interaction.user.id
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No puedes enviarte monedas a ti mismo.`
            )
          ],
          ephemeral: true
        });
      }

      const sender =
        getUser(
          interaction.user.id
        );

      const receiver =
        getUser(
          target.id
        );

      if (
        sender.wallet < amount
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.dinero} No tienes suficiente efectivo.`
            )
          ],
          ephemeral: true
        });
      }

      sender.wallet -= amount;
      receiver.wallet += amount;

      saveData();

      logAction(
        interaction.guild,
        "economia",
        {
          title:
            `${E.dinero} Transferencia`,
          description:
            `${interaction.user} envió **${money(amount)} monedas** a ${target}.`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.feliz} Enviaste **${money(amount)} monedas** a ${target}.`
          )
        ]
      });
    }

    // ===============================================
    // PROFILE
    // ===============================================

    if (
      command === "profile"
    ) {
      const target =
        interaction.options.getUser(
          "usuario"
        ) ||
        interaction.user;

      const user =
        getUser(target.id);

      const total =
        user.wallet +
        user.bank;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Perfil de ${target.username}`
            )
            .setThumbnail(
              target.displayAvatarURL()
            )
            .addFields(
              {
                name:
                  `${E.dinero} Efectivo`,
                value:
                  `**${money(user.wallet)}**`,
                inline: true
              },
              {
                name:
                  `${E.dinero} Banco`,
                value:
                  `**${money(user.bank)}**`,
                inline: true
              },
              {
                name:
                  `${E.dinero} Total`,
                value:
                  `**${money(total)}**`,
                inline: true
              },
              {
                name:
                  `${E.estrella} Nivel`,
                value:
                  `**${user.level}**`,
                inline: true
              },
              {
                name:
                  `${E.idea} XP`,
                value:
                  `**${user.xp}/${user.level * 100}**`,
                inline: true
              },
              {
                name:
                  `${E.ojo} Objetos`,
                value:
                  `**${user.inventory.length}**`,
                inline: true
              }
            )
        ]
      });
    }

    // ===============================================
    // INVENTORY
    // ===============================================

    if (
      command === "inventory"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      let description;

      if (
        user.inventory.length === 0
      ) {
        description =
          `${E.triste} No tienes objetos.`;
      } else {
        const counts = {};

        for (
          const item of
          user.inventory
        ) {
          counts[item] =
            (counts[item] || 0) + 1;
        }

        description =
          Object.entries(counts)
            .map(
              ([name, amount]) =>
                `${E.estrella} **${name}** ×${amount}`
            )
            .join("\n");
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.ojo} Inventario`
            )
            .setDescription(
              description
            )
        ]
      });
    }

    // ===============================================
    // RANK
    // ===============================================

    if (
      command === "rank"
    ) {
      const user =
        getUser(
          interaction.user.id
        );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Nivel de ${interaction.user.username}`
            )
            .setDescription(
              `${E.estrella} Nivel: **${user.level}**\n\n` +
              `${E.idea} XP: **${user.xp}/${user.level * 100}**`
            )
        ]
      });
    }

    // ===============================================
    // SHOP
    // ===============================================

    if (
      command === "shop"
    ) {
      if (
        data.shop.length === 0
      ) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLOR)
              .setTitle(
                `${E.dinero} LRM Shop`
              )
              .setDescription(
                `${E.triste} No hay productos disponibles.`
              )
          ]
        });
      }

      const products =
        data.shop
          .map(
            (product, index) => {
              const type =
                product.type ===
                "role"
                  ? "Rol"
                  : "Ítem";

              return (
                `${E.estrella} **${index + 1}. ${product.name}**\n` +
                `${E.ojo} Tipo: **${type}**\n` +
                `${E.dinero} Precio: **${money(product.price)} monedas**`
              );
            }
          )
          .join("\n\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.dinero} LRM Shop`
            )
            .setDescription(
              products
            )
        ]
      });
    }

    // ===============================================
    // BUY
    // ===============================================

    if (
      command === "buy"
    ) {
      const name =
        interaction.options.getString(
          "producto"
        );

      const product =
        data.shop.find(
          product =>
            product.name
              .toLowerCase() ===
            name.toLowerCase()
        );

      if (!product) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} Ese producto no existe.`
            )
          ],
          ephemeral: true
        });
      }

      const user =
        getUser(
          interaction.user.id
        );

      if (
        user.wallet <
        product.price
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.dinero} Necesitas **${money(product.price)} monedas**.\n\n` +
              `${E.dinero} Tienes: **${money(user.wallet)}**`
            )
          ],
          ephemeral: true
        });
      }

      if (
        product.type === "role"
      ) {
        const role =
          interaction.guild.roles.cache.get(
            product.roleId
          );

        if (!role) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.no} El rol ya no existe.`
              )
            ],
            ephemeral: true
          });
        }

        if (
          interaction.member.roles.cache.has(
            role.id
          )
        ) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.alerta} Ya tienes ese rol.`
              )
            ],
            ephemeral: true
          });
        }

        try {
          await interaction.member.roles.add(
            role
          );
        } catch (error) {
          console.error(error);

          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.prohibido} No pude entregarte el rol.`
              )
            ],
            ephemeral: true
          });
        }

        user.wallet -=
          product.price;

        saveData();

        logAction(
          interaction.guild,
          "tienda",
          {
            title:
              `${E.dinero} Compra de rol`,
            description:
              `${interaction.user} compró **${product.name}**.\n\n` +
              `${E.dinero} Precio: **${money(product.price)} monedas**\n` +
              `${E.estrella} Rol recibido: ${role}`,
            color: "#57F287",
            user:
              interaction.user
          }
        );

        return interaction.reply({
          embeds: [
            successEmbed(
              `${E.dinero} Compraste **${product.name}**.\n\n` +
              `${E.estrella} Recibiste ${role}.\n\n` +
              `${E.dinero} Saldo: **${money(user.wallet)}**`
            )
          ]
        });
      }

      user.wallet -=
        product.price;

      user.inventory.push(
        product.name
      );

      saveData();

      logAction(
        interaction.guild,
        "tienda",
        {
          title:
            `${E.dinero} Compra de ítem`,
          description:
            `${interaction.user} compró **${product.name}**.\n\n` +
            `${E.dinero} Precio: **${money(product.price)} monedas**`,
          color: "#57F287",
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Compraste **${product.name}**.\n\n` +
            `${E.ojo} Fue añadido a tu inventario.\n\n` +
            `${E.dinero} Saldo: **${money(user.wallet)}**`
          )
        ]
      });
    }

    // ===============================================
    // USE
    // ===============================================

    if (
      command === "use"
    ) {
      const item =
        interaction.options.getString(
          "item"
        );

      const user =
        getUser(
          interaction.user.id
        );

      const index =
        user.inventory.findIndex(
          inventoryItem =>
            inventoryItem
              .toLowerCase() ===
            item.toLowerCase()
        );

      if (index === -1) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes **${item}**.`
            )
          ],
          ephemeral: true
        });
      }

      user.inventory.splice(
        index,
        1
      );

      saveData();

      logAction(
        interaction.guild,
        "tienda",
        {
          title:
            `${E.ojo} Objeto utilizado`,
          description:
            `${interaction.user} utilizó **${item}**.`,
          user:
            interaction.user
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.estrella} Utilizaste **${item}**.`
          )
        ]
      });
    }

    // ===============================================
    // BALTOP
    // ===============================================

    if (
      command === "baltop"
    ) {
      const ranking =
        Object.entries(
          data.users
        )
          .map(
            ([id, user]) => ({
              id,
              total:
                user.wallet +
                user.bank
            })
          )
          .sort(
            (a, b) =>
              b.total -
              a.total
          )
          .slice(0, 10);

      if (!ranking.length) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.triste} Todavía no hay usuarios.`
            )
          ]
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.dinero} Ranking de economía`
            )
            .setDescription(
              ranking
                .map(
                  (entry, index) =>
                    `${E.estrella} **#${index + 1}** <@${entry.id}> — ${E.dinero} **${money(entry.total)}**`
                )
                .join("\n")
            )
        ]
      });
    }

    // ===============================================
    // LEVELTOP
    // ===============================================

    if (
      command === "leveltop"
    ) {
      const ranking =
        Object.entries(
          data.users
        )
          .sort(
            ([, a], [, b]) => {
              if (
                b.level !==
                a.level
              ) {
                return (
                  b.level -
                  a.level
                );
              }

              return (
                b.xp -
                a.xp
              );
            }
          )
          .slice(0, 10);

      if (!ranking.length) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.triste} Todavía no hay usuarios.`
            )
          ]
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Ranking de niveles`
            )
            .setDescription(
              ranking
                .map(
                  ([id, user], index) =>
                    `${E.estrella} **#${index + 1}** <@${id}> — Nivel **${user.level}** • ${user.xp} XP`
                )
                .join("\n")
            )
        ]
      });
    }

    // ===============================================
    // COINFLIP
    // ===============================================

    if (
      command === "coinflip"
    ) {
      const result =
        Math.random() < 0.5
          ? "Cara"
          : "Cruz";

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.feliz} Coinflip`
            )
            .setDescription(
              `${E.estrella} Resultado: **${result}**`
            )
        ]
      });
    }

    // ===============================================
    // 8BALL
    // ===============================================

    if (
      command === "8ball"
    ) {
      const question =
        interaction.options.getString(
          "pregunta"
        );

      const responses = [
        "Sí.",
        "No.",
        "Probablemente.",
        "No lo creo.",
        "Todo apunta a que sí.",
        "Tengo mis dudas.",
        "Pregunta de nuevo más tarde.",
        "Definitivamente.",
        "Puede ser."
      ];

      const answer =
        responses[
          random(
            0,
            responses.length - 1
          )
        ];

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.idea} Bola mágica`
            )
            .addFields(
              {
                name:
                  `${E.ojo} Pregunta`,
                value:
                  question
              },
              {
                name:
                  `${E.estrella} Respuesta`,
                value:
                  answer
              }
            )
        ]
      });
    }

    // ===============================================
    // RANDOM
    // ===============================================

    if (
      command === "random"
    ) {
      const min =
        interaction.options.getInteger(
          "minimo"
        );

      const max =
        interaction.options.getInteger(
          "maximo"
        );

      if (
        min >= max
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} El máximo debe ser mayor que el mínimo.`
            )
          ],
          ephemeral: true
        });
      }

      const result =
        random(min, max);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Número aleatorio`
            )
            .setDescription(
              `${E.idea} Rango: **${min} - ${max}**\n\n` +
              `## ${result}`
            )
        ]
      });
    }

    // ===============================================
    // PING
    // ===============================================

    if (
      command === "ping"
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.reloj} Pong!`
            )
            .setDescription(
              `${E.reloj} Latencia: **${client.ws.ping}ms**`
            )
        ]
      });
    }

    // ===============================================
    // BOTINFO
    // ===============================================

    if (
      command === "botinfo"
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} LRM Studio Bot`
            )
            .setThumbnail(
              client.user.displayAvatarURL()
            )
            .setDescription(
              `${E.feliz} **LRM Studio Bot**\n\n` +
              `${E.dinero} Economía\n` +
              `${E.estrella} Niveles y XP\n` +
              `${E.dinero} Tienda configurable\n` +
              `${E.ojo} Información\n` +
              `${E.feliz} Diversión\n\n` +
              `${E.idea} Usa **.help** para ver la ayuda.`
            )
        ]
      });
    }

    // ===============================================
    // SERVERINFO
    // ===============================================

    if (
      command === "serverinfo"
    ) {
      const guild =
        interaction.guild;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.ojo} ${guild.name}`
            )
            .setThumbnail(
              guild.iconURL() ||
              client.user.displayAvatarURL()
            )
            .addFields(
              {
                name:
                  `${E.estrella} Miembros`,
                value:
                  `${guild.memberCount}`,
                inline: true
              },
              {
                name:
                  `${E.idea} Canales`,
                value:
                  `${guild.channels.cache.size}`,
                inline: true
              },
              {
                name:
                  `${E.estrella} Roles`,
                value:
                  `${guild.roles.cache.size}`,
                inline: true
              },
              {
                name:
                  `${E.ojo} ID`,
                value:
                  guild.id
              }
            )
        ]
      });
    }

    // ===============================================
    // USERINFO
    // ===============================================

    if (
      command === "userinfo"
    ) {
      const target =
        interaction.options.getUser(
          "usuario"
        ) ||
        interaction.user;

      const member =
        await interaction.guild.members
          .fetch(target.id)
          .catch(() => null);

      const joined =
        member?.joinedTimestamp
          ? `<t:${Math.floor(
              member.joinedTimestamp /
                1000
            )}:R>`
          : "Desconocido";

      const created =
        `<t:${Math.floor(
          target.createdTimestamp /
            1000
        )}:R>`;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.ojo} Información de ${target.username}`
            )
            .setThumbnail(
              target.displayAvatarURL()
            )
            .addFields(
              {
                name:
                  `${E.estrella} Usuario`,
                value:
                  `${target}`,
                inline: true
              },
              {
                name:
                  `${E.idea} ID`,
                value:
                  target.id,
                inline: true
              },
              {
                name:
                  `${E.reloj} Cuenta creada`,
                value:
                  created
              },
              {
                name:
                  `${E.reloj} Entró al servidor`,
                value:
                  joined
              }
            )
        ]
      });
    }

    // ===============================================
    // AVATAR
    // ===============================================

    if (
      command === "avatar"
    ) {
      const target =
        interaction.options.getUser(
          "usuario"
        ) ||
        interaction.user;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Avatar de ${target.username}`
            )
            .setImage(
              target.displayAvatarURL({
                size: 1024
              })
            )
        ]
      });
    }
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
// START
// =====================================================

registerCommands();

client.login(TOKEN);
