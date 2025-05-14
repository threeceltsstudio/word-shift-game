// Word List for Word Shift Game
const WORD_LISTS = {
    4: [
        // Common 4-letter words (household)
        'BOOK', 'DESK', 'DOOR', 'LAMP', 'ROOM', 'WALL', 'SEAT', 'SOFA', 'SINK', 'ROOF',
        'BED', 'BOWL', 'CART', 'DISH', 'FORK', 'GATE', 'HOOK', 'KEYS', 'LOCK', 'MAIL',
        'PLUG', 'RACK', 'SOAP', 'TRAY', 'VASE', 'WIRE', 'YARD', 'ZONE', 'DECK', 'FAN',
        
        // Actions
        'WALK', 'TALK', 'JUMP', 'SING', 'READ', 'PLAY', 'WORK', 'HELP', 'MOVE', 'STOP',
        'LOOK', 'MAKE', 'TAKE', 'GIVE', 'FIND', 'KEEP', 'GROW', 'SHOW', 'TELL', 'HEAR',
        'COOK', 'DRAW', 'FALL', 'HIDE', 'KICK', 'LIFT', 'PULL', 'PUSH', 'RIDE', 'SWIM',
        'TURN', 'WASH', 'WAVE', 'WINK', 'WRAP', 'YELL', 'ZOOM', 'BEND', 'BITE', 'BLOW',
        
        // Time
        'TIME', 'HOUR', 'WEEK', 'YEAR', 'DATE', 'DAWN', 'DUSK', 'NOON', 'DARK', 'LATE',
        'SOON', 'PAST', 'FAST', 'SLOW', 'WAIT', 'RUSH', 'LONG', 'NEXT', 'LAST', 'DAY',
        
        // Nature
        'TREE', 'LEAF', 'RAIN', 'SNOW', 'WIND', 'STAR', 'MOON', 'SAND', 'SEED', 'SOIL',
        'ROCK', 'WAVE', 'LAKE', 'HILL', 'POND', 'WOOD', 'FIRE', 'HEAT', 'COLD', 'WARM',
        'BUSH', 'CAVE', 'CLIFF', 'CLOUD', 'DUST', 'FERN', 'FOG', 'HERB', 'ICE', 'MOSS',
        
        // Animals
        'BIRD', 'FISH', 'FROG', 'BEAR', 'LION', 'WOLF', 'DEER', 'DUCK', 'GOAT', 'SWAN',
        'CRAB', 'DOVE', 'HAWK', 'MOLE', 'MOTH', 'OWL', 'SEAL', 'TOAD', 'WASP', 'WORM',
        
        // Colors
        'BLUE', 'PINK', 'GOLD', 'GRAY', 'TEAL', 'JADE', 'RUBY', 'ROSE', 'MINT', 'LIME',
        'RUST', 'PLUM', 'NAVY', 'WINE', 'AQUA', 'COAL', 'CYAN', 'SAGE', 'TAN', 'PUCE',
        
        // Food
        'FOOD', 'MEAL', 'CAKE', 'SOUP', 'MEAT', 'FISH', 'RICE', 'MILK', 'BREAD', 'CORN',
        'BEAN', 'BEEF', 'BEET', 'HERB', 'JAM', 'KALE', 'LEEK', 'LIME', 'MINT', 'PEAR',
        
        // Places
        'ROME', 'PERU', 'CUBA', 'FIJI', 'MALI', 'CHAD', 'IRAN', 'IRAQ', 'LAOS', 'OSLO',
        'KIEV', 'CORK', 'LIMA', 'LYON', 'RIGA', 'SEOUL', 'SUEZ', 'TYRE', 'VALE', 'YORK',
        'ALPS', 'ASIA', 'BALI', 'CALI', 'KENT', 'NILE', 'OHIO', 'PERU', 'ROME', 'SIAM',
        
        // Body
        'HAND', 'FOOT', 'HEAD', 'FACE', 'NOSE', 'HAIR', 'NECK', 'BACK', 'SKIN', 'BONE',
        'ARM', 'EAR', 'EYE', 'JAW', 'LEG', 'LIP', 'RIB', 'TOE', 'GUM', 'HIP',
        
        // Emotions
        'LOVE', 'HOPE', 'CARE', 'FEAR', 'CALM', 'GLAD', 'KIND', 'NICE', 'GOOD', 'WISE',
        'BOLD', 'COOL', 'FINE', 'FREE', 'KEEN', 'MILD', 'PURE', 'SAFE', 'SURE', 'TRUE'
    ],
    5: [
        // Common 5-letter words (household)
        'HOUSE', 'TABLE', 'CHAIR', 'PHONE', 'CLOCK', 'PLATE', 'GLASS', 'SHELF', 'COUCH', 'FLOOR',
        'BRUSH', 'CHEST', 'FRAME', 'LIGHT', 'MIXER', 'PAPER', 'PLANT', 'RADIO', 'SCALE', 'STOOL',
        'TOWEL', 'VASE', 'WATCH', 'ALBUM', 'BROOM', 'CLOTH', 'DRYER', 'FENCE', 'KNIFE', 'LAMP',
        
        // Actions
        'WRITE', 'SPEAK', 'THINK', 'LAUGH', 'SMILE', 'SLEEP', 'DANCE', 'BUILD', 'LEARN', 'TEACH',
        'WATCH', 'CLEAN', 'START', 'BEGIN', 'CLIMB', 'DREAM', 'DRINK', 'FLOAT', 'FOCUS', 'GUIDE',
        'BLINK', 'BRUSH', 'CARRY', 'CATCH', 'CHASE', 'CLAP', 'COUNT', 'CRAWL', 'CROSS', 'DIVE',
        'DRIVE', 'ENTER', 'FETCH', 'FIGHT', 'FLASH', 'FLOAT', 'FOLD', 'GRAB', 'GREET', 'GROW',
        
        // Places
        'PARIS', 'TOKYO', 'DELHI', 'CAIRO', 'DUBAI', 'MIAMI', 'TEXAS', 'CHINA', 'SPAIN', 'KENYA',
        'WALES', 'YEMEN', 'SYRIA', 'SUDAN', 'QATAR', 'NEPAL', 'MALTA', 'LIBYA', 'KOREA', 'JAPAN',
        'INDIA', 'GHANA', 'EGYPT', 'CONGO', 'CHILE', 'BRAZIL', 'BENIN', 'ANGOLA', 'ALPS', 'ANDES',
        
        // Nature
        'BEACH', 'OCEAN', 'RIVER', 'CLOUD', 'STORM', 'GRASS', 'PLANT', 'EARTH', 'WATER', 'LIGHT',
        'SHADE', 'BLOOM', 'GROVE', 'FIELD', 'COAST', 'SHORE', 'CREEK', 'MARSH', 'WOODS', 'CLIFF',
        'CORAL', 'DELTA', 'DUNES', 'FJORD', 'FROST', 'GLADE', 'GORGE', 'HAVEN', 'INLET', 'ISLET',
        
        // Animals
        'TIGER', 'HORSE', 'SHEEP', 'SNAKE', 'EAGLE', 'WHALE', 'MOUSE', 'PANDA', 'KOALA', 'SLOTH',
        'CAMEL', 'CHIMP', 'CRANE', 'GECKO', 'GOOSE', 'HYENA', 'LLAMA', 'MOOSE', 'OTTER', 'QUAIL',
        
        // Food
        'BREAD', 'APPLE', 'GRAPE', 'PEACH', 'PIZZA', 'PASTA', 'SALAD', 'STEAK', 'SUGAR', 'HONEY',
        'BACON', 'BERRY', 'CANDY', 'CURRY', 'DATES', 'FUDGE', 'GRAVY', 'JELLY', 'LEMON', 'MANGO',
        
        // Sports
        'SPORT', 'CHESS', 'RUGBY', 'POKER', 'GOLF', 'SKATE', 'SURF', 'CLIMB', 'DANCE', 'SWIM',
        'TRACK', 'CYCLE', 'FENCE', 'JUDO', 'KARATE', 'POLO', 'RACE', 'SAIL', 'THROW', 'TRAIN',
        
        // Science
        'ATOM', 'CELL', 'GENE', 'MASS', 'WAVE', 'FORCE', 'SPACE', 'STAR', 'TIME', 'LIGHT',
        'SOUND', 'SPEED', 'POWER', 'ENERGY', 'ORBIT', 'PULSE', 'QUARK', 'SOLAR', 'VAPOR', 'WIND',
        
        // Emotions
        'HAPPY', 'BRAVE', 'QUIET', 'PEACE', 'SWEET', 'PROUD', 'TRUST', 'FAITH', 'GRACE', 'CHARM',
        'ANGRY', 'CALM', 'EAGER', 'GLAD', 'JOLLY', 'KIND', 'LUCKY', 'MERRY', 'NICE', 'PROUD',
        
        // Games
        'SCORE', 'LEVEL', 'SHIFT', 'MATCH', 'SOLVE', 'QUEST', 'PRIZE', 'BONUS', 'ROUND', 'BOARD',
        'CHESS', 'CARDS', 'DICE', 'GAME', 'MOVES', 'PIECE', 'PLAY', 'RULES', 'TEAM', 'WIN'
    ],
    6: [
        // Common 6-letter words (household)
        'WINDOW', 'MIRROR', 'CARPET', 'PILLOW', 'BASKET', 'SCREEN', 'SWITCH', 'SOCKET', 'DRAWER', 'CLOSET',
        'BLANKET', 'BOTTLE', 'CAMERA', 'CANDLE', 'COFFEE', 'CURTAIN', 'DINNER', 'FAUCET', 'FREEZER', 'GARAGE',
        'GARDEN', 'HANDLE', 'HANGER', 'HEATER', 'KETTLE', 'LADDER', 'LAPTOP', 'LOCKER', 'MIRROR', 'OUTLET',
        
        // Actions
        'LISTEN', 'SEARCH', 'CREATE', 'DESIGN', 'TRAVEL', 'WONDER', 'INVENT', 'GATHER', 'CHOOSE', 'DECIDE',
        'ACCEPT', 'ADJUST', 'ANSWER', 'APPEAR', 'ARRIVE', 'BECOME', 'BELONG', 'CHANGE', 'CHOOSE', 'FINISH',
        'BORROW', 'BOUNCE', 'BREATH', 'CANCEL', 'CIRCLE', 'COLLECT', 'COMFORT', 'COMMIT', 'CONNECT', 'CONSIDER',
        
        // Places
        'LONDON', 'BERLIN', 'MOSCOW', 'LISBON', 'MADRID', 'DUBLIN', 'MUNICH', 'PRAGUE', 'VIENNA', 'WARSAW',
        'ATHENS', 'BOSTON', 'BRUGES', 'CAIRO', 'DALLAS', 'DENVER', 'GENEVA', 'HAVANA', 'JAKARTA', 'KABUL',
        'KUWAIT', 'LAGOS', 'MANILA', 'MECCA', 'MIAMI', 'MILAN', 'NAPLES', 'OSLO', 'PARIS', 'PERTH',
        'PHOENIX', 'QUEBEC', 'RABAT', 'ROME', 'SEOUL', 'SOFIA', 'TAIPEI', 'TOKYO', 'TUNIS', 'VENICE',
        
        // Nature
        'FOREST', 'FLOWER', 'GARDEN', 'SUNSET', 'SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'BREEZE', 'STREAM',
        'MEADOW', 'VALLEY', 'DESERT', 'CANYON', 'ISLAND', 'JUNGLE', 'NATURE', 'PLANET', 'BRANCH', 'PEBBLE',
        'AURORA', 'BEACH', 'CANYON', 'CAVERN', 'CLIFF', 'CLOUD', 'CORAL', 'CRATER', 'CRYSTAL', 'DESERT',
        
        // Animals
        'MONKEY', 'RABBIT', 'TURTLE', 'PENGUIN', 'JAGUAR', 'BEAVER', 'DRAGON', 'FALCON', 'LIZARD', 'OSPREY',
        'BADGER', 'CAMEL', 'CHEETAH', 'CONDOR', 'COUGAR', 'COYOTE', 'DINGO', 'DONKEY', 'FERRET', 'GIRAFFE',
        
        // Objects
        'CAMERA', 'PENCIL', 'BUTTON', 'BOTTLE', 'CANVAS', 'COFFEE', 'COOKIE', 'DINNER', 'GUITAR', 'HAMMER',
        'JACKET', 'LADDER', 'MAGNET', 'NEEDLE', 'ORANGE', 'PACKET', 'PENCIL', 'POCKET', 'RIBBON', 'ROCKET',
        
        // Science
        'CARBON', 'ENERGY', 'MATTER', 'OXYGEN', 'PLASMA', 'PROTON', 'QUARTZ', 'RADIUM', 'SILICON', 'SODIUM',
        'THEORY', 'VACUUM', 'VECTOR', 'VOLUME', 'WEIGHT', 'XENON', 'PHOTON', 'NUCLEUS', 'NEUTRON', 'MAGNET',
        
        // Sports
        'SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'ROWING', 'SKIING', 'DIVING', 'RIDING', 'RACING', 'SAILING',
        'ARCHER', 'RUNNER', 'PLAYER', 'GOLFER', 'KEEPER', 'LEAGUE', 'MATCH', 'MEDAL', 'SCORE', 'SPORT',
        
        // Concepts
        'SIMPLE', 'GENTLE', 'SILENT', 'BRIGHT', 'SMOOTH', 'STEADY', 'STRONG', 'WISDOM', 'BEAUTY', 'ENERGY',
        'ACTIVE', 'BETTER', 'BRAVE', 'CALM', 'CLEVER', 'EAGER', 'EARLY', 'EQUAL', 'EXACT', 'FANCY'
    ],
    7: [
        // Common 7-letter words (actions)
        'EXPLORE', 'ACHIEVE', 'INSPIRE', 'IMAGINE', 'BELIEVE', 'PRESENT', 'CONNECT', 'DEVELOP', 'IMPROVE', 'PREPARE',
        'ADVANCE', 'BALANCE', 'CAPTURE', 'COMPOSE', 'DELIVER', 'ENHANCE', 'EXPLAIN', 'FORWARD', 'GATHER', 'HARVEST',
        'INCLUDE', 'JOURNEY', 'KINDLE', 'LAUNCH', 'MANAGE', 'NURTURE', 'OBSERVE', 'PERFORM', 'QUALIFY', 'RESOLVE',
        
        // Places
        'BANGKOK', 'BEIJING', 'BOMBAY', 'BRUSSELS', 'CHICAGO', 'DENMARK', 'ENGLAND', 'FINLAND', 'GERMANY', 'HOLLAND',
        'ICELAND', 'IRELAND', 'JAMAICA', 'JORDAN', 'KUWAIT', 'LEBANON', 'MALAYSIA', 'MOROCCO', 'MYANMAR', 'NAMIBIA',
        'NIGERIA', 'NORWAY', 'PAKISTAN', 'PANAMA', 'POLAND', 'PORTUGAL', 'ROMANIA', 'RUSSIA', 'RWANDA', 'SCOTLAND',
        'SENEGAL', 'SERBIA', 'SWEDEN', 'TAIWAN', 'THAILAND', 'TUNISIA', 'TURKEY', 'UGANDA', 'UKRAINE', 'URUGUAY',
        'VIETNAM', 'YEMEN', 'ZAMBIA', 'ZIMBABWE', 'ALBERTA', 'ARIZONA', 'ATHENS', 'ATLANTA', 'BAGHDAD', 'BAHRAIN',
        
        // Nature
        'RAINBOW', 'SUNRISE', 'WEATHER', 'THUNDER', 'BLOSSOM', 'DOLPHIN', 'PENGUIN', 'OCTOPUS', 'SQUIRREL', 'BUTTERFLY',
        'MEADOWS', 'ORCHARD', 'GLACIER', 'VOLCANO', 'HORIZON', 'MORNING', 'EVENING', 'SUNLIGHT', 'MOONLIT', 'STARLIT',
        'AVALANCHE', 'BAMBOO', 'BANYAN', 'BAOBAB', 'BOULDER', 'CANYON', 'CASCADE', 'CAVERN', 'CHANNEL', 'CLIMATE',
        
        // Objects
        'COMPASS', 'CRYSTAL', 'DIAMOND', 'EMERALD', 'PENDANT', 'PICTURE', 'TELESCOPE', 'TREASURE', 'VIOLIN', 'WHISTLE',
        'BACKPACK', 'BALLOON', 'BATTERY', 'BLANKET', 'BRACELET', 'CAMERA', 'CANDLE', 'CARPET', 'CHARGER', 'COMPASS',
        
        // Technology
        'COMPUTER', 'NETWORK', 'DISPLAY', 'MONITOR', 'KEYBOARD', 'PROGRAM', 'WEBSITE', 'CHANNEL', 'DIGITAL', 'WIRELESS',
        'ANDROID', 'BROWSER', 'CONSOLE', 'DESKTOP', 'FIREWALL', 'GATEWAY', 'HEADSET', 'INTERNET', 'JOYSTICK', 'LAPTOP',
        
        // Science
        'BIOLOGY', 'CHEMISTRY', 'ECOLOGY', 'GEOLOGY', 'PHYSICS', 'QUANTUM', 'REACTOR', 'SCIENCE', 'THEORY', 'VOLTAGE',
        'ALGEBRA', 'ATOM', 'BATTERY', 'BINARY', 'CALCIUM', 'CARBON', 'CELL', 'CLIMATE', 'CRYSTAL', 'DENSITY',
        
        // Concepts
        'HARMONY', 'MYSTERY', 'COURAGE', 'FREEDOM', 'JUSTICE', 'PATIENCE', 'RESPECT', 'SUCCESS', 'WISDOM', 'WONDER',
        'BALANCE', 'BEAUTY', 'CLARITY', 'COMFORT', 'DIGNITY', 'ENERGY', 'ESSENCE', 'ETERNAL', 'FANTASY', 'FORTUNE',
        
        // Time
        'FOREVER', 'TONIGHT', 'WEEKEND', 'HOLIDAY', 'MORNING', 'EVENING', 'PRESENT', 'FUTURE', 'INSTANT', 'ETERNAL',
        'CENTURY', 'DECADE', 'ENDLESS', 'ETERNITY', 'HISTORY', 'LIFETIME', 'MOMENT', 'MONTHLY', 'SEASON', 'WEEKLY'
    ],
    8: [
        // Common 8-letter words (actions)
        'DISCOVER', 'PROGRESS', 'PRACTICE', 'CONTINUE', 'ORGANIZE', 'REMEMBER', 'CONSIDER', 'DESCRIBE', 'MAINTAIN', 'PRESERVE',
        'APPROACH', 'COMPLETE', 'CONVINCE', 'DECREASE', 'ESTIMATE', 'INCREASE', 'INDICATE', 'INFLUENCE', 'MOTIVATE', 'NAVIGATE',
        'ACTIVATE', 'ANALYZE', 'ANNOUNCE', 'ARRANGE', 'ASSEMBLE', 'BALANCE', 'CALCULATE', 'CELEBRATE', 'CLASSIFY', 'COMBINE',
        
        // Places
        'ADELAIDE', 'AMSTERDAM', 'AUCKLAND', 'BANGKOK', 'BARCELONA', 'BEIJING', 'BELGRADE', 'BERLIN', 'BORDEAUX', 'BRISBANE',
        'BRUSSELS', 'BUCHAREST', 'BUDAPEST', 'CALGARY', 'CANBERRA', 'CARDIFF', 'CHENNAI', 'CHICAGO', 'COLOGNE', 'COLOMBO',
        'DAMASCUS', 'DELHI', 'DETROIT', 'DUBLIN', 'DURBAN', 'EDINBURGH', 'FLORENCE', 'FRANKFURT', 'GLASGOW', 'HAMBURG',
        'HANOI', 'HAVANA', 'HELSINKI', 'HOUSTON', 'ISTANBUL', 'JAKARTA', 'KINGSTON', 'KOLKATA', 'KRAKOW', 'LAUSANNE',
        'LEIPZIG', 'LISBON', 'LIVERPOOL', 'LONDON', 'MADRID', 'MALMÖ', 'MANCHESTER', 'MARSEILLE', 'MELBOURNE', 'MONTREAL',
        
        // Nature
        'SUNSHINE', 'MOUNTAIN', 'WATERFALL', 'SEASHORE', 'SNOWFALL', 'RAINFALL', 'STARLIGHT', 'MOONLIGHT', 'RAINBOW', 'BUTTERFLY',
        'AVALANCHE', 'BLIZZARD', 'BOULDER', 'CANYON', 'CASCADE', 'CAVERN', 'CHANNEL', 'CLIFF', 'COASTLINE', 'CONTINENT',
        
        // Objects
        'BUILDING', 'COMPUTER', 'KEYBOARD', 'TELESCOPE', 'UMBRELLA', 'PAINTING', 'FURNITURE', 'NECKLACE', 'BACKPACK', 'BOOKSHELF',
        'ARMCHAIR', 'BASEBALL', 'BATTERY', 'BLANKET', 'BRACELET', 'CALENDAR', 'CAMERA', 'CANDLE', 'CARPET', 'CARRIAGE',
        
        // Technology
        'COMPUTER', 'SOFTWARE', 'HARDWARE', 'INTERNET', 'WIRELESS', 'DATABASE', 'NETWORK', 'PLATFORM', 'PROTOCOL', 'SECURITY',
        'ANDROID', 'ANTIVIRUS', 'BANDWIDTH', 'BLUETOOTH', 'BROWSER', 'DESKTOP', 'DIGITAL', 'DOWNLOAD', 'ETHERNET', 'FIREWALL',
        
        // Science
        'CHEMISTRY', 'BIOLOGY', 'PHYSICS', 'GEOLOGY', 'ASTRONOMY', 'MEDICINE', 'RESEARCH', 'MOLECULE', 'PARTICLE', 'REACTION',
        'ACADEMIC', 'ANALYSIS', 'ATOM', 'CARBON', 'CELL', 'CLIMATE', 'CRYSTAL', 'DENSITY', 'ELECTRON', 'ELEMENT',
        
        // Concepts
        'PEACEFUL', 'GRACEFUL', 'POWERFUL', 'THANKFUL', 'CREATIVE', 'POSITIVE', 'FRIENDLY', 'KINDNESS', 'STRENGTH', 'PATIENCE',
        'ABSOLUTE', 'ABSTRACT', 'ACCURATE', 'ADVANCED', 'ANCIENT', 'ANIMATED', 'ARTISTIC', 'AUTHENTIC', 'BALANCED', 'BEAUTIFUL',
        
        // Time and Space
        'DAYLIGHT', 'MIDNIGHT', 'TIMELESS', 'DISTANCE', 'INFINITY', 'UNIVERSE', 'ETERNITY', 'TOMORROW', 'EVERYDAY', 'LIFETIME',
        'ANNUAL', 'CENTURY', 'CONSTANT', 'DURATION', 'ENDLESS', 'ETERNAL', 'FREQUENT', 'HISTORIC', 'IMMORTAL', 'INFINITE',
        
        // Education
        'LEARNING', 'TEACHING', 'STUDYING', 'RESEARCH', 'THINKING', 'TRAINING', 'READING', 'WRITING', 'SPEAKING', 'LISTENING',
        'ACADEMIC', 'ADVANCED', 'ANALYSIS', 'COLLEGE', 'COURSE', 'DEGREE', 'DIPLOMA', 'EDUCATION', 'GRADUATE', 'KNOWLEDGE',
        
        // Adventure
        'ADVENTURE', 'JOURNEY', 'TREASURE', 'PARADISE', 'VACATION', 'FESTIVAL', 'CARNIVAL', 'BIRTHDAY', 'HOLIDAY', 'WEEKEND',
        'ACTIVITY', 'CAMPING', 'CLIMBING', 'CYCLING', 'DIVING', 'EXPLORING', 'FISHING', 'HIKING', 'HUNTING', 'SAILING'
    ]
};

// Export the word lists
export default WORD_LISTS; 