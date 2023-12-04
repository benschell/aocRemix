import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 4;
const slug = '2023.04';
const name = 'Day 04';

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

  const lines = rawInput.split('\n');
  let pointSum = 0;
  let maxCardNum = 0;
  const cardNumWinnings: {[key: string]: number} = {};
  const getKey = (cardNum: number) => {
    return `Card ${`${cardNum}`.padStart(5, '0')}`;
  };
  const ownedScratchCards: {[key: string]: number} = {
    [getKey(1)]: 1
  };
  for (const line of lines) {
    if (!line || line.length === 0) {
      continue;
    }
    const splitCard = line.split(':');
    const cardNumParts = splitCard[0].trim().split(' ');
    const cardNum = parseInt(cardNumParts[cardNumParts.length-1]);
    const cardName = getKey(cardNum); // Turn `Card   1` into `Card 00001`
    const numParts = splitCard[1].split('|');

    ownedScratchCards[cardName] = 1;

    maxCardNum = Math.max(cardNum, maxCardNum);

    const winningNumsStr = numParts[0].trim();
    const winningNumStrs = winningNumsStr.split(' ');
    const winningNums = winningNumStrs.map((numStr) => parseInt(numStr)).sort();

    const ourNumsStr = numParts[1].trim();
    const ourNumStrs = ourNumsStr.split(' ');
    const ourNums = ourNumStrs.map((numStr) => parseInt(numStr)).sort();

    // Look through ourNums and see if they exist in winningNums
    // Exit early on each loop if we've reached a larger winningNum
    let numWins = 0;
    let thisCardsWinningNums: number[] = [];
    for (const ourNum of ourNums) {
      let shouldContinue = false;
      for (const winningNum of winningNums) {
        if (ourNum === winningNum) {
          thisCardsWinningNums.push(ourNum);
          numWins++;
          break;
        } else if (ourNum > winningNum) {
          // We've look at all winningNums smaller than ourNum, so we won't find a match.
          // Stop looking for this ourNum
          shouldContinue = true;
        }
      }
      if (shouldContinue) {
        continue;
      }
    }

    const points = numWins > 0 ? Math.pow(2, (numWins-1)) : 0;
    pointSum += points;
    output.push(`- ${cardName} has ${numWins} winning numbers (${thisCardsWinningNums}), so it is worth ${points} points.`);
    
    cardNumWinnings[cardName] = numWins;
    // output.push(`Store: ${numWins} for ${cardName} :: ${JSON.stringify(cardNumWinnings)}`);
  }
  output.unshift(`Part 1: ${pointSum}`);
  let cardSum = 0;
  for (let cardNum = 1; cardNum <= maxCardNum; cardNum++) {
    // Look at each card and increment their winnings appropriately
    const cardName = getKey(cardNum);
    output.push(`# ${cardName} has ${cardNumWinnings[cardName]} winnings, so incrementing:`)

    // Add owned cards based on winnings
    for (let i = cardNum+1; i <= cardNum + cardNumWinnings[cardName]; i++) {
      // output.push(`\tAdding ownership of ${i}`);
      // ownedScratchCards[cardNum] of each of them
      const thisCardName = getKey(i);
      if (!Object.hasOwn(ownedScratchCards, thisCardName)) {
        ownedScratchCards[thisCardName] = 0;
      }
      ownedScratchCards[thisCardName] += ownedScratchCards[cardName];
    }
  }
  for (const key in ownedScratchCards) {
    cardSum += ownedScratchCards[key];
    output.unshift(`# ${ownedScratchCards[key]} of ${key}`);
  }
  output.unshift(`Part 2: ${cardSum}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}