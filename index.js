const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ChannelType } = require('discord.js');

const TOKEN         = process.env.BOT_TOKEN;
const GUILD_ID      = '1441175529872162868';
const WELCOME_CH    = '1479067270905987158';
const TICKETS_CAT   = '1479077416663253062';
const VERIFIED_ROLE = '1441181835769020466';
const CEO_ROLE      = '1441180829291253791';
const COCEO_ROLE    = '1442928560753872987';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ══════════════════════════════════════
//  READY
// ══════════════════════════════════════
client.once('ready', async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.commands.set([
    {
      name: 'ticket-panel',
      description: '🎫 Poster le panel de tickets dans ce salon (CEO uniquement)',
    },
    {
      name: 'reglement',
      description: '📋 Afficher le règlement dans ce salon (CEO uniquement)',
    },
    {
      name: 'fermer',
      description: '🔒 Fermer ce ticket',
    },
  ]);
  console.log('✅ Slash commands enregistrées');
});

// ══════════════════════════════════════
//  BIENVENUE
// ══════════════════════════════════════
client.on('guildMemberAdd', async member => {
  const ch = member.guild.channels.cache.get(WELCOME_CH);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setColor(0xc0392b)
    .setTitle('🔫 Bienvenue chez Grinta Gun Shop !')
    .setDescription(`Bienvenue **${member.user.username}** !\n\nTu peux te connecter sur notre site et créer ton compte en cliquant sur **Connexion** avec Discord.\n\n🌐 **grinta-gun-shop.web.app**`)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: 'Grinta Gun Shop · Armurerie Professionnelle' })
    .setTimestamp();

  await ch.send({ content: `<@${member.id}>`, embeds: [embed] });
});

// ══════════════════════════════════════
//  SLASH COMMANDS
// ══════════════════════════════════════
client.on('interactionCreate', async interaction => {

  // ── Vérif CEO/Co-CEO
  const isCEO = interaction.member?.roles?.cache?.has(CEO_ROLE) || interaction.member?.roles?.cache?.has(COCEO_ROLE);

  // ── /ticket-panel (CEO uniquement)
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket-panel') {
    if (!isCEO) {
      return interaction.reply({ content: '❌ Seuls les CEO et Co-CEO peuvent utiliser cette commande.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle('🎫 Support — Grinta Gun Shop')
      .setDescription(
        '**Besoin d\'aide ? Ouvre un ticket !**\n\n' +
        '📦 Commande / Livraison\n' +
        '🔧 Problème technique\n' +
        '💬 Question générale\n' +
        '⚠️ Signalement\n\n' +
        '*Clique sur le bouton ci-dessous pour créer un ticket privé avec notre équipe.*'
      )
      .setFooter({ text: 'Grinta Gun Shop · Support' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('📩 Ouvrir un ticket')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // ── /reglement (CEO uniquement)
  if (interaction.isChatInputCommand() && interaction.commandName === 'reglement') {
    if (!isCEO) {
      return interaction.reply({ content: '❌ Seuls les CEO et Co-CEO peuvent utiliser cette commande.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle('📋 Règlement — Grinta Gun Shop')
      .setDescription(
        '**1.** Respectez tous les membres du serveur.\n' +
        '**2.** Aucun spam ni publicité non autorisée.\n' +
        '**3.** Les transactions se font uniquement via le site officiel.\n' +
        '**4.** Toute tentative de fraude entraîne un ban immédiat.\n' +
        '**5.** Les décisions du staff sont finales.\n' +
        '**6.** Respectez la vie privée de chacun.\n\n' +
        '*En cliquant sur ✅ Accepter, vous confirmez avoir lu et accepté le règlement.*'
      )
      .setFooter({ text: 'Grinta Gun Shop · Armurerie Professionnelle' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('accept_rules')
        .setLabel('✅ Accepter le règlement')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // ── /fermer
  if (interaction.isChatInputCommand() && interaction.commandName === 'fermer') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Cette commande ne fonctionne que dans un ticket.', ephemeral: true });
    }
    await interaction.reply('🔒 Fermeture du ticket dans 5 secondes...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  // ── Bouton : ouvrir ticket
  if (interaction.isButton() && interaction.customId === 'open_ticket') {
    const guild = interaction.guild;
    const user = interaction.user;

    const existing = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
    if (existing) {
      return interaction.reply({ content: `❌ Tu as déjà un ticket ouvert : <#${existing.id}>`, ephemeral: true });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: interaction.channel.parentId,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: CEO_ROLE, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: COCEO_ROLE, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle(`🎫 Ticket — ${user.username}`)
      .setDescription(`Bonjour <@${user.id}> !\n\nDécris ton problème ci-dessous, le staff te répondra dès que possible.\n\nUtilise le bouton ci-dessous pour fermer ce ticket.`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Fermer le ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });

    const notifCh = guild.channels.cache.get(TICKETS_CH);
    if (notifCh) {
      await notifCh.send(`🎫 Nouveau ticket ouvert par <@${user.id}> : <#${ticketChannel.id}>`);
    }

    await interaction.reply({ content: `✅ Ticket créé : <#${ticketChannel.id}>`, ephemeral: true });
  }

  // ── Bouton : accepter règlement
  if (interaction.isButton() && interaction.customId === 'accept_rules') {
    const member = interaction.member;
    try {
      await member.roles.add(VERIFIED_ROLE);
      await interaction.reply({ content: '✅ Tu as accepté le règlement et reçu ton rôle !', ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: '❌ Impossible d\'attribuer le rôle (vérifie les permissions du bot).', ephemeral: true });
    }
  }

  // ── Bouton : fermer ticket
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.reply('🔒 Fermeture dans 5 secondes...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

client.login(TOKEN);
