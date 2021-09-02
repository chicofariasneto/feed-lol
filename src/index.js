const mariadb = require('mariadb');
const champions = require('./helpers/champions.json');

const model = {
    champ: 'INSERT INTO league.champion(id, availability, display_name, title) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id;',
    spell: 'INSERT INTO league.spell(id, display_name, champion_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = id;',
    skin: 'INSERT INTO league.skin(id, availability, name, picture_id, champion_id) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id;'
}

const pool = mariadb.createPool({
    host: 'mydb.com',
    user: 'myUser',
    password: 'myPassword',
    connectionLimit: 5
});

const getDataFromJSON = () => {
    let myQueries = [];
    champions.forEach(element => {
        const {
            id,
            displayName,
            title,
            price,
            availability,
            spells,
            skins: { notOwned, owned }
        } = element;

        myQueries.push({
            id,
            displayName,
            title,
            price,
            availability,
            spells,
            skins: owned.concat(notOwned)
        });
    });

    return myQueries;
}

const insertMariaDB = async (data) => {
    let conn;
    try {
        conn = await pool.getConnection();

        for (const element of data) {
            console.log('<===========================================================================>');
            const { id, displayName, title, availability, spells, skins } = element;

            // champion (id, availability, display_name, title)
            await conn.query(model.champ, [id, availability, displayName, title]);
            console.log(`< ${displayName} has been inserted >`)

            for (const spell of spells) {
                const { id: spellId, displayName } = spell;

                // spell (id, display_name, champion_id)
                await conn.query(model.spell, [spellId, displayName, id]);
                console.log(`< Spell ${displayName} has been inserted >`);
            }

            for (const skin of skins) {
                const { id: skinId, name, pictureId, availability } = skin;

                // skin (id, availability, name, picture_id, champion_id)
                await conn.query(model.skins, [skinId, availability, name, pictureId, id]);
                console.log(`< Skin ${name} has been inserted >`);
            }
            console.log('<===========================================================================>\n');
        };

        return "Everything went well...";
    } catch (err) {
        console.log(err);
        return "Something went wrong...";
    } finally {
        if (conn) return conn.end();
    }
}

const execScript = async () => {
    const data = getDataFromJSON();
    const result = await insertMariaDB(data);
    return result;
}
execScript().then(console.log);
