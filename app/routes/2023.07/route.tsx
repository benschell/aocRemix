import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 7;
const dayStr = `${dayNum}`.padStart(2, '0');
const slug = `2023.${dayStr}`;
const name = `Day ${dayStr}`;

export async function loader({}: LoaderFunctionArgs) {
  const __dirname = getDirname();
  const inputs = await fs.readdir(`${__dirname}/../app/routes/${slug}/inputs`);
  return json({
    inputs
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: name},
    { name: "description", content: name },
  ];
};

export default function Day00() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() || {output: '', rawInput: ''};
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto">
      <h1>{name} <Link to={`https://adventofcode.com/2023/day/${dayNum}`} className="text-lg text-blue-600 hover:underline">Puzzle</Link></h1>

      <h2>Input:</h2>
      <Form method="post" className="flex max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="selected-input" value="Available File Inputs:" />
          </div>
          <Select name="selected-input">
            {data.inputs.map((input, index) => (
              <option key={`option-${index}`}>{input}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="raw-input" value="Raw Text Input:" />
          </div>
          <Textarea name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  type HandData = {
    handStr: string,
    cardCounts: {[key: string]: number},
    handHex: string,
    handVal: number,
    handBid: number,
    topCard: number, // For highCard
    secondCard: number, // For secondCard
    potentials: {
      fiveOfAKind?: boolean,
      fourOfAKind?: boolean,
      fullHouse?: boolean,
      threeOfAKind?: boolean,
      twoPair?: boolean,
      onePair?: boolean,
      threeCardsOf?: number,
      twoCardsOf?: number[],
    },
    rank?: number
  };
  /*

  const handsRaw = rawInput.split('\n');
  const fiveOfAKind: HandData[] = [],
        fourOfAKind: HandData[] = [],
        fullHouse: HandData[] = [],
        threeOfAKind: HandData[] = [],
        twoPair: HandData[] = [],
        onePair: HandData[] = [],
        highCard: HandData[] = [];
  let numHands: number = 0;
  const mapCardToInt: {[key: string]: number} = {
    'A': 14,
    'K': 13,
    'Q': 12,
    'J': 11,
    'T': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2
  };

  const placeInArray = (arr: HandData[], hand: HandData) => {
    // output.push(`Placing parts: ${JSON.stringify(hand)}`);
    numHands++;
    arr.push(hand);
  };
  for (let handIdx = 0; handIdx < handsRaw.length; handIdx++) {
    if (!handsRaw[handIdx].length) {
      continue;
    }

    // Process this hand
    const handParts = handsRaw[handIdx].split(' ');
    const handStr = handParts[0];
    const handBid = parseInt(handParts[1].trim());

    const handHex = handStr.replaceAll('A', 'E').replaceAll('K', 'D').replaceAll('Q', 'C').replaceAll('J', 'B').replaceAll('T', 'A');
    const handVal = parseInt(handHex, 16);

    output.push(`Hand: ${handStr}; Bid: ${handBid}`);

    // Figure out *which* bucket
    const parts: HandData = { cardCounts: {}, handStr, handHex, handVal, handBid, topCard: 0, secondCard: 0, potentials: {} };
    for (let charIdx = 0; charIdx < handStr.length; charIdx++) {
      const card = handStr[charIdx];
      const cardVal = mapCardToInt[card];
      // if (cardVal >= parts.topCard) {
      //   if (parts.topCard > 0) {
      //     parts.secondCard = parts.topCard;
      //   }
      //   parts.topCard = cardVal;
      // } else if (cardVal > parts.secondCard) {
      //   parts.secondCard = cardVal;
      // }
      if (!parts.cardCounts[card]) {
        parts.cardCounts[card] = 1;
      } else {
        parts.cardCounts[card] += 1;
      }
      if (parts.cardCounts[card] > 4) {
        parts.potentials.fiveOfAKind = true;
      }
      if (parts.cardCounts[card] > 3) {
        parts.potentials.fourOfAKind = true;
      }
      if (parts.cardCounts[card] > 2) {
        parts.potentials.fullHouse = true;
        parts.potentials.threeCardsOf = cardVal;
        parts.potentials.threeOfAKind = true;
      }
      if (parts.cardCounts[card] > 1) {
        parts.potentials.twoPair = true;
        parts.potentials.onePair = true;
        if (!parts.potentials.twoCardsOf) {
          parts.potentials.twoCardsOf = [];
        }
        parts.potentials.twoCardsOf.push(cardVal);
      }
    }
    if (parts.potentials.fiveOfAKind) {
      // output.push(`Placing into fiveOfAKind`);
      placeInArray(fiveOfAKind, parts);
      continue;
    }
    if (parts.potentials.fourOfAKind) {
      // output.push(`Placing into fourOfAKind`);
      placeInArray(fourOfAKind, parts);
      continue;
    }
    if (parts.potentials.fullHouse || parts.potentials.threeOfAKind) {
      if (parts.potentials.fullHouse) {
        // Look through the cardCounts and figure out if there's ALSO a two
        let hasPair = !!Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length;
        // output.push(`hasPair: ${Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length}: ${hasPair}`);
        if (hasPair) {
          // Full House
          // output.push(`Placing into fullHouse`);
          placeInArray(fullHouse, parts);
          continue;
        }
      }
      // If it was fullHouse || threeOfAKind and it's not a fullHouse, then it must be threeOfAKind
      // output.push(`Placing into threeOfAKind`);
      placeInArray(threeOfAKind, parts);
      continue;
    }
    if (parts.potentials.twoPair || parts.potentials.onePair) {
      if (parts.potentials.twoPair) {
        // Look through the cardCounts and figure out if there are multiple twos
        let hasTwoPair = Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length == 2;
        // output.push(`hasTwoPair? ${Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2)} vs. 2: ${hasTwoPair}`);
        if (hasTwoPair) {
          // output.push(`Placing into twoPair`);
          placeInArray(twoPair, parts);
          continue;
        }
      }
      // If it was twoPair || onePair and it's not a twoPair, then it must be onePair
      // output.push(`Placing into onePair`);
      placeInArray(onePair, parts);
      continue;
    }
    
    // If it wasn't any of the above, it must be highCard
    // output.push(`Placing into highCard`);
    placeInArray(highCard, parts);
    continue;
  }

  // Sort each array:
  let outputVal = 0;
  let currentRank = numHands;
  [fiveOfAKind, fourOfAKind, fullHouse, threeOfAKind, twoPair, onePair, highCard].forEach((arr) => {
    arr.sort((b, a) => a.handVal - b.handVal);
    arr.forEach((hand) => {
      hand.rank = currentRank--;
      outputVal += hand.rank * hand.handBid;
    });
  });

  const printArr = (arr: HandData[]) => arr.map((hand) => `${hand.handStr} => ${hand.handVal} (Rank: ${hand.rank} => ${hand.rank! * hand.handBid})`)

  output.push(`fiveOfAKind: ${printArr(fiveOfAKind)}`);
  output.push(`fourOfAKind: ${printArr(fourOfAKind)}`);
  output.push(`fullHouse: ${printArr(fullHouse)}`);
  output.push(`threeOfAKind: ${printArr(threeOfAKind)}`);
  output.push(`twoPair: ${printArr(twoPair)}`);
  output.push(`onePair: ${printArr(onePair)}`);
  output.push(`highCard: ${printArr(highCard)}`);

  output.unshift(`Output val: ${outputVal}`);
  // 233699292 is too low
  // 246409899 is right

  //*/

  const handsRaw = rawInput.split('\n');
  const fiveOfAKind: HandData[] = [],
        fourOfAKind: HandData[] = [],
        fullHouse: HandData[] = [],
        threeOfAKind: HandData[] = [],
        twoPair: HandData[] = [],
        onePair: HandData[] = [],
        highCard: HandData[] = [];
  let numHands: number = 0;
  const mapCardToInt: {[key: string]: number} = {
    'A': 13,
    'K': 12,
    'Q': 11,
    'T': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2,
    'J': 1,
  };

  const placeInArray = (arr: HandData[], hand: HandData) => {
    // output.push(`Placing parts: ${JSON.stringify(hand)}`);
    numHands++;
    arr.push(hand);
  };
  for (let handIdx = 0; handIdx < handsRaw.length; handIdx++) {
    if (!handsRaw[handIdx].length) {
      continue;
    }

    // Process this hand
    const handParts = handsRaw[handIdx].split(' ');
    const handStr = handParts[0];
    const handBid = parseInt(handParts[1].trim());

    const handHex = handStr.replaceAll('A', 'D').replaceAll('K', 'C').replaceAll('Q', 'B').replaceAll('J', '1').replaceAll('T', 'A');
    const handVal = parseInt(handHex, 16);

    output.push(`Hand: ${handStr}; Bid: ${handBid}`);

    // Figure out *which* bucket
    const parts: HandData = { cardCounts: {}, handStr, handHex, handVal, handBid, topCard: 0, secondCard: 0, potentials: {} };
    for (let charIdx = 0; charIdx < handStr.length; charIdx++) {
      const card = handStr[charIdx];
      const cardVal = mapCardToInt[card];
      // if (cardVal >= parts.topCard) {
      //   if (parts.topCard > 0) {
      //     parts.secondCard = parts.topCard;
      //   }
      //   parts.topCard = cardVal;
      // } else if (cardVal > parts.secondCard) {
      //   parts.secondCard = cardVal;
      // }
      if (!parts.cardCounts[card]) {
        parts.cardCounts[card] = 1;
      } else {
        parts.cardCounts[card] += 1;
      }
      if (parts.cardCounts[card] > 4) {
        parts.potentials.fiveOfAKind = true;
      }
      if (parts.cardCounts[card] > 3) {
        parts.potentials.fourOfAKind = true;
      }
      if (parts.cardCounts[card] > 2) {
        parts.potentials.fullHouse = true;
        parts.potentials.threeCardsOf = cardVal;
        parts.potentials.threeOfAKind = true;
      }
      if (parts.cardCounts[card] > 1) {
        parts.potentials.twoPair = true;
        parts.potentials.onePair = true;
        if (!parts.potentials.twoCardsOf) {
          parts.potentials.twoCardsOf = [];
        }
        parts.potentials.twoCardsOf.push(cardVal);
      }
    }
    if (parts.potentials.fiveOfAKind) {
      // output.push(`Placing into fiveOfAKind`);
      placeInArray(fiveOfAKind, parts);
      continue;
    }
    if (parts.potentials.fourOfAKind) {
      // output.push(`Placing into fourOfAKind`);
      if (parts.cardCounts.J > 0) {
        output.push(`Escalating from fourOfAKind to fiveOfAKind: ${parts.handStr}`);
        placeInArray(fiveOfAKind, parts);
        continue;
      }
      placeInArray(fourOfAKind, parts);
      continue;
    }
    if (parts.potentials.fullHouse || parts.potentials.threeOfAKind) {
      if (parts.potentials.fullHouse) {
        // Look through the cardCounts and figure out if there's ALSO a two
        let hasPair = !!Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length;
        // output.push(`hasPair: ${Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length}: ${hasPair}`);
        if (hasPair) {
          // Full House
          // If any card is a J (the three or the pair), then this can be a fiveOfAKind
          if (parts.cardCounts.J > 1) {
            output.push(`Escalating from fullHouse to fiveOfAKind: ${parts.handStr}`);
            placeInArray(fiveOfAKind, parts);
            continue;
          }
          // output.push(`Placing into fullHouse`);
          placeInArray(fullHouse, parts);
          continue;
        }
      }
      // If it was fullHouse || threeOfAKind and it's not a fullHouse, then it must be threeOfAKind
      // If we have a J, this can become a fourOfAKind
      if (parts.cardCounts.J > 0) {
        output.push(`Escalating from threeOfAKind to fourOfAKind: ${parts.handStr}`);
        placeInArray(fourOfAKind, parts);
        continue;
      }
      // output.push(`Placing into threeOfAKind`);
      placeInArray(threeOfAKind, parts);
      continue;
    }
    if (parts.potentials.twoPair || parts.potentials.onePair) {
      if (parts.potentials.twoPair) {
        // Look through the cardCounts and figure out if there are multiple twos
        let hasTwoPair = Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2).length == 2;
        // output.push(`hasTwoPair? ${Object.keys(parts.cardCounts).filter((cardStr) => parts.cardCounts[cardStr] === 2)} vs. 2: ${hasTwoPair}`);
        if (hasTwoPair) {
          // If one of the pairs was a J, we could have a fourOfAKind!
          if (parts.cardCounts.J === 2) {
            output.push(`Escalating from twoPair to fourOfAKind: ${parts.handStr}`);
            placeInArray(fourOfAKind, parts);
            continue;
          }
          // If we have a single J, this could be a fullHouse
          if (parts.cardCounts.J === 1) {
            output.push(`Escalating from twoPair to fullHouse: ${parts.handStr}`);
            placeInArray(fullHouse, parts);
            continue;
          }
          // output.push(`Placing into twoPair`);
          placeInArray(twoPair, parts);
          continue;
        }
      }
      // If it was twoPair || onePair and it's not a twoPair, then it must be onePair
      // If we have a J (even if its the pair), we can have a threeOfAKind
      if (parts.cardCounts.J > 0) {
        output.push(`Escalating from onePair to threeOfAKind: ${parts.handStr}`);
        placeInArray(threeOfAKind, parts);
        continue;
      }
      // output.push(`Placing into onePair`);
      placeInArray(onePair, parts);
      continue;
    }
    
    // If it wasn't any of the above, it must be highCard
    // If we have a J, though, we can make this a pair
    if (parts.cardCounts.J > 0) {
      output.push(`Escalating from highCard to onePair: ${parts.handStr}`);
      placeInArray(onePair, parts);
      continue;
    }
    // output.push(`Placing into highCard`);
    placeInArray(highCard, parts);
    continue;
  }

  // Sort each array:
  let outputVal = 0;
  let currentRank = numHands;
  [fiveOfAKind, fourOfAKind, fullHouse, threeOfAKind, twoPair, onePair, highCard].forEach((arr) => {
    arr.sort((b, a) => a.handVal - b.handVal);
    arr.forEach((hand) => {
      hand.rank = currentRank--;
      outputVal += hand.rank * hand.handBid;
    });
  });

  const printArr = (arr: HandData[]) => arr.map((hand) => `${hand.handStr} => 0x${hand.handHex} (Rank: ${hand.rank})`)

  output.push(`fiveOfAKind: ${printArr(fiveOfAKind)}`);
  output.push(`fourOfAKind: ${printArr(fourOfAKind)}`);
  output.push(`fullHouse: ${printArr(fullHouse)}`);
  output.push(`threeOfAKind: ${printArr(threeOfAKind)}`);
  output.push(`twoPair: ${printArr(twoPair)}`);
  output.push(`onePair: ${printArr(onePair)}`);
  output.push(`highCard: ${printArr(highCard)}`);

  output.unshift(`Output val: ${outputVal}`);
  // 244861870 is too high
  // 244863654 will be too high, not submitting
  // 244936999 will be too high, not submitting
  // 245025810 will be too high, not submitting
  // 244848487
  return json({ ok: true, rawInput, output: output.join('\n') });
}