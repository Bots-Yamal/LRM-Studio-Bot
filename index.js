const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes
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

const E = {
  feliz: "<:feliz:1543374186540568586>",
  triste: "<:llorando:1543373946383114332>",
  alerta: "<:alerta:1563019834495606824>",
  no: "<:no:1543374123714089122>",
  dinero: "<:dinero:1563019819639640266>",
  ojo: "<:emoji_20:1557625884461109348>",
  prohibido: "<:prohibido:1543374036149477428>",
  idea: "<:idea:1543374116176928859>",
  reloj: "<:reloj:1543374030713790515>",
  estrella: "<:estrella:1543374328140144742>"
};

const EMOJI_ID = {
  feliz: "1543374186540568586",
  triste: "1543373946383114332",
  alerta: "1563019834495606824",
  no: "1543374123714089122",
  dinero: "1563019819639640266",
  ojo: "1557625884461109348",
  prohibido: "1543374036149477428",
  idea: "1543374116176928859",
  reloj: "1543374030713790515",
  estrella: "1543374328140144742"
};

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
// DATA.JSON
// Se crea automáticamente.
// =====================================================

const DEFAULT_DATA = {
  users: {},
  shop: [],
  settings: {}
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DEFAULT_DATA, null, 2)
    );

    return JSON.parse(
      JSON.stringify(DEFAULT_DATA)
    );
  }

  try {
    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    parsed.users ??= {};
    parsed.shop ??= [];
    parsed.settings ??= {};

    return parsed;

  } catch (error) {
    console.error(
      "Error leyendo data.json:",
      error
    );

    return JSON.parse(
      JSON.stringify(DEFAULT_DATA)
    );
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
    Math.random() * (max - min + 1)
  ) + min;
}

function money(amount) {
  return Number(amount)
    .toLocaleString("es-ES");
}

function errorEmbed(text) {
  return new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle(`${E.no} Ha ocurrido un problema`)
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot"
    });
}

function successEmbed(text) {
  return new EmbedBuilder()
    .setColor("#57F287")
    .setTitle(`${E.feliz} Completado`)
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot"
    });
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
    Math.floor(seconds / 3600);

  seconds %= 3600;

  const minutes =
    Math.floor(seconds / 60);

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

  if (user.xp >= required) {

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
// SLASH COMMANDS USUARIOS
// =====================================================

const userCommands = [

  // ===================================================
  // ECONOMÍA
  // ===================================================

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription(
      "Consulta tu balance."
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
    .setName("work")
    .setDescription(
      "Trabaja para conseguir monedas."
    ),

  new SlashCommandBuilder()
    .setName("slut")
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

  // ===================================================
  // PERFIL
  // ===================================================

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

  // ===================================================
  // TIENDA
  // ===================================================

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

  // ===================================================
  // RANKINGS
  // ===================================================

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

  // ===================================================
  // DIVERSIÓN
  // ===================================================

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

  // ===================================================
  // INFORMACIÓN
  // ===================================================

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
        .setDescription(
          "Usuario."
        )
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
        .setDescription(
          "Usuario."
        )
        .setRequired(false)
    )

];

// =====================================================
// TODOS LOS SLASH
// Usuarios + admin.js
// =====================================================

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
// CONECTAR ADMIN.JS
// =====================================================

setupAdmin(
  client,
  {
    data,
    saveData
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
      "================================="
    );

    client.user.setActivity(
      "LRM Studio ✨"
    );
  }
);

// =====================================================
// PREFIX
// .help
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

    // =================================================
    // .HELP
    // =================================================

    if (command === "help") {

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

            `Selecciona una categoría en el menú inferior para consultar mis comandos.\n\n` +

            `${E.dinero} **Economía**\n` +
            `${E.estrella} **Perfil**\n` +
            `${E.dinero} **Tienda**\n` +
            `${E.estrella} **Rankings**\n` +
            `${E.feliz} **Diversión**\n` +
            `${E.idea} **Información**\n\n` +

            `${E.idea} Los comandos administrativos están separados en **.admin**.`
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
                id: EMOJI_ID.dinero
              }
            },
            {
              label: "Perfil",
              description:
                "Perfil, inventario y niveles.",
              value: "perfil",
              emoji: {
                id: EMOJI_ID.estrella
              }
            },
            {
              label: "Tienda",
              description:
                "Compra productos y roles.",
              value: "tienda",
              emoji: {
                id: EMOJI_ID.dinero
              }
            },
            {
              label: "Rankings",
              description:
                "Consulta los mejores usuarios.",
              value: "rankings",
              emoji: {
                id: EMOJI_ID.estrella
              }
            },
            {
              label: "Diversión",
              description:
                "Comandos para pasar el rato.",
              value: "diversion",
              emoji: {
                id: EMOJI_ID.feliz
              }
            },
            {
              label: "Información",
              description:
                "Información del bot y servidor.",
              value: "informacion",
              emoji: {
                id: EMOJI_ID.idea
              }
            }
          );

      const row =
        new ActionRowBuilder()
          .addComponents(menu);

      return message.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }
);

// =====================================================
// INTERACTIONS
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    // =================================================
    // AUTOCOMPLETE /BUY
    // =================================================

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

    // =================================================
    // HELP MENU
    // =================================================

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
            `${E.dinero} **/balance**\n` +
            `Consulta tu dinero y banco.\n\n` +

            `${E.feliz} **/work**\n` +
            `Gana **20-30 monedas**.\n` +
            `${E.reloj} Cada **30 segundos**.\n\n` +

            `${E.alerta} **/slut**\n` +
            `Puedes ganar **40-70 monedas**.\n` +
            `${E.triste} 70% de probabilidad de recibir una penalización de **50-100 monedas**.\n` +
            `${E.reloj} Cada **1 minuto**.\n\n` +

            `${E.alerta} **/crime**\n` +
            `Puedes ganar **50-80 monedas**.\n` +
            `${E.triste} 80% de probabilidad de recibir una penalización de **70-200 monedas**.\n` +
            `${E.reloj} Cada **2 minutos**.\n\n` +

            `${E.estrella} **/daily**\n` +
            `Recibe **50 monedas** cada **24 horas**.\n\n` +

            `${E.dinero} **/dep cantidad/all**\n` +
            `Deposita dinero en el banco.\n\n` +

            `${E.dinero} **/with cantidad/all**\n` +
            `Retira dinero del banco.\n\n` +

            `${E.dinero} **/pay usuario cantidad**\n` +
            `Envía monedas a otro usuario.`
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
            `${E.dinero} **/baltop** — Ranking de economía.\n\n` +
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
            `${E.feliz} **/coinflip** — Cara o cruz sin apuestas.\n\n` +
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

    // =================================================
    // SLASH
    // =================================================

    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const command =
      interaction.commandName;

    // =================================================
    // BALANCE
    // =================================================

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
        user.wallet + user.bank;

      const embed =
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
          .setFooter({
            text:
              "LRM Studio Bot • Economía"
          });

      return interaction.reply({
        embeds: [embed]
      });
    }

    // =================================================
    // WORK
    // =================================================

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
          30 * 1000
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

      addXP(
        interaction.user.id
      );

      saveData();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E.feliz} Trabajo completado`
            )
            .setDescription(
              `Terminaste tu trabajo correctamente.\n\n` +
              `${E.dinero} Ganaste **${amount} monedas**.\n\n` +
              `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Work"
            })
        ]
      });
    }

    // =================================================
    // SLUT
    // =================================================

    if (
      command === "slut"
    ) {

      const user =
        getUser(
          interaction.user.id
        );

      const cooldown =
        checkCooldown(
          user,
          "slut",
          60 * 1000
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
        "slut"
      );

      // 70% de probabilidad
      // de penalización.
      const loses =
        Math.random() < 0.70;

      if (loses) {

        const amount =
          random(50, 100);

        // Puede quedar negativo,
        // como pediste.
        user.wallet -= amount;

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.triste} Salió mal`
              )
              .setDescription(
                `Esta vez la acción no salió bien.\n\n` +
                `${E.triste} Penalización: **-${amount} monedas**\n\n` +
                `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
              )
              .setFooter({
                text:
                  "LRM Studio Bot"
              })
          ]
        });
      }

      const amount =
        random(40, 70);

      user.wallet += amount;

      addXP(
        interaction.user.id
      );

      saveData();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E.feliz} ¡Salió bien!`
            )
            .setDescription(
              `${E.dinero} Conseguistes **${amount} monedas**.\n\n` +
              `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
            )
            .setFooter({
              text:
                "LRM Studio Bot"
            })
        ]
      });
    }

    // =================================================
    // CRIME
    // =================================================

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
          2 * 60 * 1000
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

      // 80% de probabilidad
      // de penalización.
      const loses =
        Math.random() < 0.80;

      if (loses) {

        const amount =
          random(70, 200);

        // El saldo puede
        // quedar negativo.
        user.wallet -= amount;

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.alerta} El crimen salió mal`
              )
              .setDescription(
                `Fuiste descubierto y recibiste una multa.\n\n` +
                `${E.triste} Multa: **-${amount} monedas**\n\n` +
                `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
              )
              .setFooter({
                text:
                  "LRM Studio Bot • Crime"
              })
          ]
        });
      }

      const amount =
        random(50, 80);

      user.wallet += amount;

      addXP(
        interaction.user.id
      );

      saveData();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E.feliz} Acción completada`
            )
            .setDescription(
              `${E.dinero} Conseguistes **${amount} monedas**.\n\n` +
              `${E.dinero} Efectivo actual: **${money(user.wallet)}**`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Crime"
            })
        ]
      });
    }

    // =================================================
    // DAILY
    // =================================================

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
          24 * 60 * 60 * 1000
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

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E.estrella} Recompensa diaria`
            )
            .setDescription(
              `${E.feliz} Recogiste tu recompensa diaria.\n\n` +
              `${E.dinero} Recibiste **50 monedas**.\n\n` +
              `${E.reloj} Próxima recompensa en **24 horas**.`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Daily"
            })
        ]
      });
    }

    // =================================================
    // DEP
    // =================================================

    if (
      command === "dep"
    ) {

      const user =
        getUser(
          interaction.user.id
        );

      const input =
        interaction.options
          .getString("cantidad")
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

      let amount;

      if (input === "all") {

        amount =
          user.wallet;

      } else {

        amount =
          Number(input);
      }

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.idea} Introduce una cantidad válida o escribe **all**.`
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
              `${E.no} No tienes suficientes monedas en efectivo.`
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
            `${E.dinero} Depositaste **${money(amount)} monedas**.\n\n` +
            `${E.dinero} Efectivo: **${money(user.wallet)}**\n` +
            `${E.estrella} Banco: **${money(user.bank)}**`
          )
        ]
      });
    }

    // =================================================
    // WITH
    // =================================================

    if (
      command === "with"
    ) {

      const user =
        getUser(
          interaction.user.id
        );

      const input =
        interaction.options
          .getString("cantidad")
          .trim()
          .toLowerCase();

      let amount;

      if (input === "all") {

        amount =
          user.bank;

      } else {

        amount =
          Number(input);
      }

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.idea} Introduce una cantidad válida o escribe **all**.`
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

    // =================================================
    // PAY
    // =================================================

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

      // Si está en negativo,
      // tampoco puede pagar.
      if (
        sender.wallet < amount
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.dinero} No tienes suficiente efectivo para realizar esta transferencia.`
            )
          ],
          ephemeral: true
        });
      }

      sender.wallet -= amount;
      receiver.wallet += amount;

      saveData();

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E.dinero} Transferencia completada`
            )
            .setDescription(
              `${E.feliz} ${interaction.user} envió **${money(amount)} monedas** a ${target}.`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Pay"
            })
        ]
      });
    }

    // =================================================
    // PROFILE
    // =================================================

    if (
      command === "profile"
    ) {

      const target =
        interaction.options.getUser(
          "usuario"
        ) ||
        interaction.user;

      const user =
        getUser(
          target.id
        );

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
            .setFooter({
              text:
                "LRM Studio Bot • Perfil"
            })
        ]
      });
    }

    // =================================================
    // INVENTORY
    // =================================================

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
          `${E.triste} No tienes objetos en tu inventario.`;

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
              `${E.ojo} Inventario de ${interaction.user.username}`
            )
            .setDescription(
              description
            )
            .setFooter({
              text:
                "LRM Studio Bot • Inventory"
            })
        ]
      });
    }

    // =================================================
    // RANK
    // =================================================

    if (
      command === "rank"
    ) {

      const user =
        getUser(
          interaction.user.id
        );

      const required =
        user.level * 100;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Nivel de ${interaction.user.username}`
            )
            .setThumbnail(
              interaction.user.displayAvatarURL()
            )
            .setDescription(
              `${E.estrella} Nivel actual: **${user.level}**\n\n` +
              `${E.idea} XP: **${user.xp}/${required}**`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Levels"
            })
        ]
      });
    }

    // =================================================
    // SHOP
    // =================================================

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
                `${E.triste} Actualmente no hay productos disponibles.\n\n` +
                `${E.idea} Un administrador puede añadir productos desde **.admin**.`
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
            .setFooter({
              text:
                "Utiliza /buy para comprar"
            })
        ]
      });
    }

    // =================================================
    // BUY
    // =================================================

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
              `${E.no} Ese producto no existe en la tienda.`
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
              `${E.dinero} Necesitas **${money(product.price)} monedas** para comprar **${product.name}**.\n\n` +
              `${E.dinero} Tienes: **${money(user.wallet)}**`
            )
          ],
          ephemeral: true
        });
      }

      // ===============================================
      // PRODUCTO TIPO ROL
      // ===============================================

      if (
        product.type === "role"
      ) {

        const role =
          interaction.guild
            .roles.cache
            .get(
              product.roleId
            );

        if (!role) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.no} El rol asociado a este producto ya no existe.`
              )
            ],
            ephemeral: true
          });
        }

        if (
          interaction.member.roles.cache
            .has(role.id)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.alerta} Ya tienes el rol ${role}.`
              )
            ],
            ephemeral: true
          });
        }

        try {

          await interaction.member
            .roles.add(role);

        } catch (error) {

          console.error(error);

          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.prohibido} No pude entregarte ${role}.\n\n` +
                `${E.idea} Un administrador debe revisar la jerarquía y los permisos del bot.`
              )
            ],
            ephemeral: true
          });
        }

        // Descontamos después
        // de entregar el rol.
        user.wallet -=
          product.price;

        saveData();

        return interaction.reply({
          embeds: [
            successEmbed(
              `${E.dinero} Compraste **${product.name}** por **${money(product.price)} monedas**.\n\n` +
              `${E.estrella} Recibiste ${role}.\n\n` +
              `${E.dinero} Saldo restante: **${money(user.wallet)}**`
            )
          ]
        });
      }

      // ===============================================
      // PRODUCTO TIPO ITEM
      // ===============================================

      user.wallet -=
        product.price;

      user.inventory.push(
        product.name
      );

      saveData();

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.dinero} Compraste **${product.name}** por **${money(product.price)} monedas**.\n\n` +
            `${E.ojo} El objeto fue añadido a tu inventario.\n\n` +
            `${E.dinero} Saldo restante: **${money(user.wallet)}**`
          )
        ]
      });
    }

    // =================================================
    // USE
    // =================================================

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
              `${E.no} No tienes **${item}** en tu inventario.`
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

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.estrella} Utilizaste **${item}**.`
          )
        ]
      });
    }

    // =================================================
    // BALTOP
    // =================================================

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

      if (
        ranking.length === 0
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.triste} Todavía no hay usuarios en el ranking.`
            )
          ]
        });
      }

      const description =
        ranking
          .map(
            (entry, index) =>
              `${E.estrella} **#${index + 1}** <@${entry.id}> — ${E.dinero} **${money(entry.total)}**`
          )
          .join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.dinero} Ranking de economía`
            )
            .setDescription(
              description
            )
            .setFooter({
              text:
                "LRM Studio Bot • Top 10"
            })
        ]
      });
    }

    // =================================================
    // LEVELTOP
    // =================================================

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

      if (
        ranking.length === 0
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.triste} Todavía no hay usuarios en el ranking.`
            )
          ]
        });
      }

      const description =
        ranking
          .map(
            ([id, user], index) =>
              `${E.estrella} **#${index + 1}** <@${id}> — Nivel **${user.level}** • ${user.xp} XP`
          )
          .join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR)
            .setTitle(
              `${E.estrella} Ranking de niveles`
            )
            .setDescription(
              description
            )
            .setFooter({
              text:
                "LRM Studio Bot • Top 10"
            })
        ]
      });
    }

    // =================================================
    // COINFLIP
    // =================================================

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
              `${E.reloj} La moneda está girando...\n\n` +
              `${E.estrella} Resultado: **${result}**`
            )
        ]
      });
    }

    // =================================================
    // 8BALL
    // =================================================

    if (
      command === "8ball"
    ) {

      const question =
        interaction.options
          .getString(
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

    // =================================================
    // RANDOM
    // =================================================

    if (
      command === "random"
    ) {

      const min =
        interaction.options
          .getInteger(
            "minimo"
          );

      const max =
        interaction.options
          .getInteger(
            "maximo"
          );

      if (
        min >= max
      ) {

        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} El número máximo debe ser mayor que el mínimo.`
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

    // =================================================
    // PING
    // =================================================

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

    // =================================================
    // BOTINFO
    // =================================================

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
              client.user
                .displayAvatarURL()
            )
            .setDescription(
              `${E.feliz} **LRM Studio Bot**\n\n` +

              `${E.dinero} Economía y banco\n` +
              `${E.estrella} Niveles y XP\n` +
              `${E.dinero} Tienda configurable\n` +
              `${E.ojo} Información\n` +
              `${E.feliz} Diversión\n\n` +

              `${E.idea} Utiliza **.help** para consultar todos los comandos.`
            )
            .setFooter({
              text:
                "LRM Studio Bot"
            })
        ]
      });
    }

    // =================================================
    // SERVERINFO
    // =================================================

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
              client.user
                .displayAvatarURL()
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
                  guild.id,
                inline: false
              }
            )
            .setFooter({
              text:
                "LRM Studio Bot • Server Info"
            })
        ]
      });
    }

    // =================================================
    // USERINFO
    // =================================================

    if (
      command === "userinfo"
    ) {

      const target =
        interaction.options
          .getUser(
            "usuario"
          ) ||
        interaction.user;

      const member =
        await interaction.guild
          .members.fetch(
            target.id
          )
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
                  created,
                inline: false
              },
              {
                name:
                  `${E.reloj} Entró al servidor`,
                value:
                  joined,
                inline: false
              }
            )
            .setFooter({
              text:
                "LRM Studio Bot • User Info"
            })
        ]
      });
    }

    // =================================================
    // AVATAR
    // =================================================

    if (
      command === "avatar"
    ) {

      const target =
        interaction.options
          .getUser(
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
            .setFooter({
              text:
                "LRM Studio Bot • Avatar"
            })
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
