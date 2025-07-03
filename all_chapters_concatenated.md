BAYES, BITS & BRAINS - ALL CHAPTERS CONCATENATED
Generated on: Wed Jul  2 09:23:41 AM CEST 2025

################################################################################
PART: INTRO
################################################################################

=================================================================================
=================================================================================
CHAPTER: Riddles
FILE: 00-introduction.mdx
=================================================================================
=================================================================================

# All those riddles <a id="introduction"></a>

This site contains an introduction to various topics at the intersection of probability, information theory, and machine learning. 
{/*Our tour guide through this corner of the world is a formula called _Kullback-Leibler (KL) divergence_. */}

Check out [this page](about) for logistics. Here, I've got several riddles. I hope that some of them will [nerd-snipe](https://xkcd.com/356/) you! 😉 You will understand all of them at the end of this minicourse. 


<Expand headline = "🧠 Intelligence test">
Test your intelligence with the following widget! You will be given a bunch of text snippets cut from Wikipedia cut at a random place. Your task is to predict the next letter. You can compare your performance with some neural nets! 

<LetterPredictionWidget/>

Why are neural nets so good in this? Why should this game measure intelligence? And why did Claude Shannon - the information theory [GOAT](https://www.merriam-webster.com/dictionary/goat) - make this experiment in 1940's? 
</Expand>

<Expand headline="🔮 How good are your predictions?"> <a id="predictions"></a>

It'd be awesome to know the future—or at least know someone who does. So you've gathered some experts and came up with five questions (Q1 to Q5). You ask the experts to give you probabilities for all 5 questions.
A year later, you know what actually happened and are ready to find the best expert.  

![questions](00-introduction/questions.png)

Question is: who's the best here?

<MultipleChoiceQuestion
  options={["🧑 Expert 1", "👵🏿 Expert 2", "👶 Expert 3"]}
  correctIndices={[0, 1, 2]}
  feedbackType="all-show"
  explanation={<>This is actually hard to tell with just 5 questions, we would need many more of them. But I am not a big fan of 🧑 though, with his failed 99%-confidence prediction! Later, we'll see how KL divergence gives us the log-score that forecasting tournaments use; this score penalizes failed 99%-confidence predictions quite heavily!   
  <ExpertRatingWidget
    title="Log score"
    showBrierScore={false}
  />  </> }
  />
</Expand>



<Expand headline="📈 S&P shape"> <a id="financial-mathematics"></a>

{/* ![Financial Data Distribution](00-introduction/sap_graph.png) */}

Every day, the S&P index price jumps around a bit. <Footnote>If you don't know what the S&P is, just think Bitcoin, Apple stock, or how many euros you can buy with a dollar</Footnote>

I grabbed some historical data, calculated the daily price changes, normalized them <Footnote>I.e., I am plotting the so-called log-return <Math math = "\ln P_t/P_{t-1} \approx 1 + \frac{P_t - P_{t-1}}{P_{t-1}}" /> for each consecutive daily prices $P_{t-1}, P_t$. </Footnote> and threw them in a histogram. The x-axis shows how big the change was (positive about half the time, negative the other half) anad the y-axis shows how often that size change happens. Before I show you the plot, take a guess—what's it gonna look like? 

![shapes](00-introduction/shapes.png)

<MultipleChoiceQuestion
  options={["A", "B", "C"]}
  correctIndices={[1, 2]}
  feedbackType="all-show"
  explanation={<>This is hard to say, try it below yourself. I fitted the data by two curves - Gaussian distribution (looks like the shape in C), and Laplace distribution (looks like the shape in B). 
  <FinancialDistributionWidget showBTC={false} showSAP={true} />
  What's happening here? We will discuss this example in the [chapter about the max-entropy principle](05-max_entropy). This principle is extremely useful in situations like ours, when we want to model some kind of data. <br/><br/></>}
/>

</Expand>





<Expand advanced={false} headline="🌐 How large is Wikipedia?"><a id="wikipedia"></a>
Marcus Hutter, an AI researcher, started <a href="http://prize.hutter1.net/">this challenge</a>: Take a 1GB file of Wikipedia text. How small can you compress it? <a href="https://en.wikipedia.org/wiki/ZIP_(file_format)">Zipping it</a> gets you about 300MB. But we can do way better. What's the current record? 

<MultipleChoiceQuestion
  options={["around 1MB", "around 10MB", "around 100MB"]}
  correctIndices={[2]}
  explanation={<>It's around 100MB. But wait—why does an <em>AI</em> researcher care about compression? We'll see the connection with <a href="02-crossentropy/coding">entropy</a>, <a href = "02-crossentropy/hutter">next token prediction</a>, and <a href="#">Kolmogorov complexity</a>. In the meantime, you can try to guess how well can various other texts be compressed by various algorithms. 
  <CompressionWidget />
</>}
/> 
</Expand>

<Expand headline="🦶 Average foot"> <a id="statistics"></a>

![rod](00-introduction/rod.png "Determining the length of the foot in 1522; taken from https://commons.wikimedia.org/wiki/File:Determination_of_the_rute_and_the_feet_in_Frankfurt.png")

Back in the day, people measured stuff in feet. Sure, we all kinda know how long a foot is, but eventually you need to nail it down precisely. One way (shown above) is to grab 16 random people and average their foot lengths:
<Math displayMode={true} math="\bar X = \frac{1}{16} (X_1 + \dots + X_{16})" />

This gives you a pretty stable number that shouldn't change much if you do it again. To measure how good your estimate is, you'd usually calculate the standard deviation. Remember the formula? Which one's right:

<MultipleChoiceQuestion
  options={[
    <Math math="\bar{\sigma}^2 = \frac{1}{15} \sum_{i=1}^{16} (X_i - \bar{X})^2" />,
    <Math math="\bar{\sigma}^2 = \frac{1}{16} \sum_{i=1}^{16} (X_i - \bar{X})^2" />,
    <Math math="\bar{\sigma}^2 = \frac{1}{17} \sum_{i=1}^{16} (X_i - \bar{X})^2" />
  ]}
  correctIndices={[0, 1, 2]}
  feedbackType="all-show"
  explanation={<>In a sense, they're all correct! Well, more like they're all defensible options from the viewpoint of frequentist statistics. Using <Math math="1/(n-1)" /> gives you the <a href="https://en.wikipedia.org/wiki/Bias_of_an_estimator">unbiased estimate</a>, <Math math="1/n" /> gives the <a href="https://en.wikipedia.org/wiki/Maximum_likelihood_estimation">maximum likelihood estimate</a>, and <Math math="1/(n+1)" /> minimizes <a href="https://en.wikipedia.org/wiki/Mean_squared_error">the mean squared error</a> between your guess and the truth.<br/><br/>But here's the thing: out of all these ways to estimate stuff, only maximum likelihood became the rockstar of machine learning. Using KL divergence, <a href="04-minimizing#mle">we'll see</a> why maximum likelihood is so special and what makes it tick.</>}
/>
</Expand>


{/*
<Expand headline="🧠 LLM training"> <a id="deep-learning"></a>

So you wanna train a large language model (LLM) like GPT/Gemini/Claude. These beasts take text, do some crazy computations, and spit out the next letter (Well, actually the next [token](https://en.wikipedia.org/wiki/Large_language_model#Tokenization), which is like a little chunk of letters).
LLMs don't just guess a single letter—they predict the whole distribution $p$ of what might come next. 

Training LLMs is complicated as hell, but one super important bit is picking the _loss function_. Here's the deal: take some text that shows up everywhere online, like "My name is A". We know what usually comes next—maybe "l" is common (all those Alexes), but "a" not so much. Call this the ground-truth distribution $p$.

Your LLM tries to guess this distribution with its own guess $q$. We need to measure how close $q$ is to $p$ using a loss function, then make that number as small as possible during training. So given distributions $p = \{p_1, \dots, p_k\}$ and $q = \{q_1, \dots, q_k\}$, which loss function should we pick?

<MultipleChoiceQuestion
  options={[
    <><Math math="\mathcal L(p,q) = \sum_{i = 1}^k |p_i - q_i|" /></>,
    <><Math math="\mathcal L(p,q) = \sum_{i = 1}^k (p_i - q_i)^2" /></>,
    <><Math math="\mathcal L(p,q) = \sum_{i = 1}^k p_i \cdot \log (p_i / q_i)" /></>
  ]}
  correctIndices={[2]}
  explanation={<>The first two work okay, but practioners typically use KL divergence. Here's why it's nice: if <Math math="p_i = 0.5" /> and <Math math="q_i = 0.49" />, KL thinks that's basically fine. But if <Math math="p_i = 0.01" /> and <Math math="q_i = 0.0" />, KL freaks out (the ratio <Math math="p_i/q_i" /> is infinite). On the other hand, the other two loss functions think both situations are similar problem. <br/><br/>Check out this widget with two distributions and all three loss functions. <br/><br/><DistributionComparisonWidget title="KL Divergence Explorer" /></>}
/>
</Expand>
*/}

<Expand headline="🔗 Distance from independence"> <a id="information-theory"></a>

Independence is huge in probability. Quick refresher: you've got two distributions $p_1$ and $p_2$. Maybe $p_1$ is about weather (☀️ or ☁️) and $p_2$ is how I get to work (🚶‍♀️, 🚲, or 🚌). A joint distribution is a table showing the probability of each combo. Here are three possible joint distributions for three different people:

![Which table is the "most" independent?](00-introduction/independence.png)

All three have the same _marginals_: 70% good weather, and 20%/30%/50% for walk/bike/bus.

Two distributions are independent if their joint distribution equals the product of the marginals. Here's what independence looks like:

![Independent distributions](00-introduction/independence2.png)

Which of our three tables is "closest" to being independent?

<MultipleChoiceQuestion
  options={["Table 1", "Table 2", "Table 3"]}
  correctIndices={[1]}
  explanation={<><a href="01-kl_intro#information-theory">We'll see</a> this is measured by something called mutual information, which is super important in information theory and—surprise!—it's just KL divergence in disguise.<br/><br/>Try it yourself with the interactive widget below:<br/><br/><MutualInformationWidget /></>}
/>
</Expand>

<Expand headline="🤓 Understanding XKCD jokes"> <a id = "xkcd"></a>

<a href="https://xkcd.com/1159/" target="_blank" rel="noopener noreferrer">
  <img src="00-introduction/countdown.png" alt="Are the odds in our favor?" style={{cursor: 'pointer'}} />
</a>

So... are the odds in our favor?

<MultipleChoiceQuestion
  options={["Yes", "No", "depends"]}
  correctIndices={[1, 2]}
  explanation={<>
  The guy in the hat seems to be confident that at least one digit behind the picture is not zero. If those digits are uniformly random and independent, it's a safe assumption. However, we will develop the maximum entropy principle that will explain our gut feeling: Given all the zeros we can see, it's actually very likely that all other hidden digits are zeros too. 

  More about that later, we will test it out with the calculator below. <br/><br/><XKCDCountdownWidget /></>}
/> 
</Expand>


<Expand headline="🤯 Machine Learning mess"> <a id="machine-learning"></a>

When you first dive into machine learning, it looks like total chaos—just a bunch of random tricks and optimization problems. Like, say you wanna understand how DALLE or Midjourney work. The standard setup for image generation is called a variational autoencoder. You train it by optimizing this absolute monster: 

<Math displayMode={true} math = "\frac{1}{N} \sum_{i = 1}^N \left( \sum_y p'(y | x) \frac{\| X_i - \textrm{Dec}(y)\|^2}{2d} \,+\, \left( \frac12 \sum_{j = 1}^d \textrm{Enc}_{\mu, j}(X_i)^2 + \textrm{Enc}_{\sigma^2, j}(X_i) - \log \textrm{Enc}_{\sigma^2, j}(X_i) \right)\right)"/>

Where the hell does this come from?? [We'll see](06-machine_learning) how KL divergence makes sense of this mess—and tons of other standard ML algorithms too. 

![Examples](06-machine_learning/table.png)

</Expand>





## 🚀 What's next? <a id="next-steps"></a>

As we go through the mini-course, we'll revisit each puzzle and understand what's going on. 
There are three parts to it. 

1. First, we will understand how Bayes' rule leads to the notions of KL divergence, cross-entropy and entropy (first three chapters). 
2. Next, we will see that minimizing KL divergence is a powerful principle to build good probabilistic models. We will use it to explain where the machine-learning loss function are coming from. (next three chapters)
3. Finally, we will discuss how entropy and KL divergence are related to coding theory, and what kind of intuition it gives us about large language models. 

See you in [the first chapter](01-kl_intro)!

################################################################################
PART I: FOUNDATIONS
################################################################################

=================================================================================
=================================================================================
CHAPTER: Bayes & KL divergence
FILE: 01-kl_intro.mdx
=================================================================================
=================================================================================

# Bayes' rule & KL divergence <a id="quantifying-information"></a>

In this chapter, we'll discuss Bayes' rule and use it to introduce KL divergence.

<KeyTakeaway>
KL divergence measures how well a distribution $p$ is fitted by a model distribution $q$.
</KeyTakeaway>


## 🕵️ Bayes' rule

Let's refresh on Bayes' rule—it's how you update your beliefs when you get new info. Here's a setup that we will try to understand very deeply in the next few chapters:

<Block headline = "Bayesian detective">
A detective holds a coin that might, or might not be rigged. To keep it simple, let's say there are only two options: it's either fair (50/50 for heads/tails) or it's biased toward tails (25/75 for heads/tails). 

A detective keeps flipping this coin in the hope of getting to know the truth. 
</Block>

Let's see how Bayes' rule helps our detective. To use the rule, we need a starting guess - a _prior_ - for the probability of each hypothesis. Let's say that we think there's a 2/3 chance the coin is fair and 1/3 chance it's biased.

We flip the coin—Heads! This is evidence for the hypothesis that the coin is fair since heads are more likely with a fair coin. 

Bayes' rule calculates the new probability (the _posterior_) that it's fair. The standard way to write the rule goes like this:

<Math id="bayes-formula" displayMode={true} math='P(\textrm{fair} | \textrm{heads}) = \frac{P(\textrm{heads} | \textrm{fair}) \cdot P(\textrm{fair})}{P(\textrm{heads})}' />

This is no rocket science — if you multiply both sides by $P(\textrm{heads})$, both sides express the quantity <Math math = "P(\textrm{fair AND heads})" /> using conditional probabilities.

## ➗ Divide and conquer

I like to think about Bayes' rule a bit differently:

<Math displayMode={true} math='\underbrace{\frac{P(\textrm{fair} | \textrm{heads})}{P(\textrm{biased} | \textrm{heads})}}_{\textrm{Posterior odds}} = \underbrace{\frac{P(\textrm{fair})}{P(\textrm{biased})}}_{\textrm{Prior odds}} \cdot \underbrace{\frac{P(\textrm{heads} | \textrm{fair})}{P(\textrm{heads} | \textrm{biased})}}_{\textrm{Likelihood ratio}}' />

This formula is just another way of writing down the Bayes' rule. <Footnote>Why? Use formula <EqRef id="bayes-formula" /> for both $P(\textrm{fair} | \textrm{heads})$ and $P(\textrm{biased} | \textrm{heads})$, then divide them. </Footnote> To understand the message of this version, let's think in [odds](https://en.wikipedia.org/wiki/Odds) instead of probabilities. Gamblers love this—instead of "1/3 chance of this, 2/3 chance of that," they say "odds are 1:2." Odds don't need to add to one (1:2 is the same as 2:4), which actually often comes pretty handy - it allows you to focus on the more important parts of the picture.

With odds, Bayes' formula is super clean! You just have to multiply your prior odds by <Math math = "\frac{P(\textrm{heads} | \textrm{fair})}{P(\textrm{heads} | \textrm{biased})}" />—that's how much more likely heads are under each hypothesis. These conditional probabilities <Math math = "P(\textrm{event} | \textrm{hypothesis})" /> are called [_likelihoods_](https://en.wikipedia.org/wiki/Likelihood_function), so this ratio is the likelihood ratio.

Here's how it works in practice: <Footnote>Getting Bayes' rule is super important. If this explanation is too fast, check out [this explainer](https://www.lesswrong.com/w/bayes-rule). </Footnote>

<BayesCalculatorWidget />

We increased our probability of fair coin from $66.7\%$ to $80\%$. Our suspicion seems to be confirmed but it could also be a fluke. Let's flip the coin a few more times. 

{/*Bayes' theorem simply says we should do the simplest thing possible with the two relevant ratios -- multiply them -- to arrive at the posterior odds $P(\textrm{fair} | \textrm{heads}) : P(\textrm{biased} | \textrm{heads})$ .*/}

## ✖️ Go forth and multiply

KL divergence is about what happens when we keep flipping. Picture our Bayesian hero flipping over and over, updating her beliefs each time using Bayes. If she gets $\{H, T, T, H, T\}$, here's what's happening:

<BayesSequenceWidget />

Every flip, she multiplies her odds by a likelihood ratio: $2/1$ for heads, $2/3$ for tails.

In this example, three tails out of five slightly favor the fair-coin hypothesis. After converting back to probabilities, her initial 66.7% belief in fairness increased to about 70%. Gonna need way more flips to know for sure!

## 0️⃣1️⃣ A bit better summary

Before we see what happens long-term, let's improve our calculator a bit. We'll get a bit more clarity if we take logs of everything. Instead of multiplying odds and likelihood, we will be adding so-called _log-odds_. 

Here's the same step-by-step calculator after taking logarithm. For example, "prior 1:0" in the calculator means that the prior is $2^1 : 2^0$. <Footnote>As a computer scientist, I always use $\log_2$, so I mostly drop the subscript and just write $\log$. </Footnote> 


<BayesSequenceLogWidget />

Notice that all the likelihoods (numbers in yellow rows) are now negative numbers. That makes sense - probabilities are smaller than one, so after taking the log, they become negative numbers. It's often useful to talk about absolute values of those numbers, which is why people define a quantity called _[surprisal](https://en.wikipedia.org/wiki/Information_content)_: Whenever you have something happening with probability $p$, the expression $\log 1/p$ can be called a surprisal and its values are bits. 

This is a logarithmic viewpoint on how surprised you are when something happens. Getting heads when you thought it was 1% likely? Super surprising ($\log 1/0.01 \approx 6.6 \textrm{bits}$). Getting heads on a fair coin? Meh ($\log 1/0.5 = 1 \textrm{bit}$).

When we subtract surprisals for the same outcome under different hypotheses, we get how much evidence that outcome provides. For our coin example, heads give us 1 bit of surprisal given the fair hypothesis and two bits of surprisal given the biased hypothesis, so we get 1 bit of evidence towards the fair hypothesis. Analogously, tails give 0.58 bits of evidence towards the biased hypothesis.

To get the final probability, add up all the surprisals for each hypothesis, exponentiate, and don't forget the prior.
In our example, the total evidence for the fair hypothesis is:

$$
1 - 0.58 - 0.58 + 1 - 0.58 \approx 0.25. 
$$

We started with one bit favoring the fair hypothesis, so we end up with 1.25 bits for fair. Convert that back and you get about 70% probability the coin is fair.

## 📊 Expected evidence <a id="expected-distinguishing-evidence"></a>

Let's say the coin actually is biased. How fast will our Bayesian hero figure this out? We can calculate the average number of bits that she learns per flip. Heads give -1 bit (negative because it points the wrong way), tails give +0.58 bits. On average, each flip gives:

$$
0.25 \cdot (-1) + 0.75 \cdot 0.58 \approx 0.19
$$

bits of evidence toward the truth. {/*This is the KL divergence between the true 25%/75% distribution and the model 50%/50% distribution!*/}

What does this mean in practice? After about 5 flips, you get one bit of evidence on average. So if you start thinking 2:1 the coin is fair, after ~5 flips you'll be at 1:1. Another 5 flips gets you to 2:1 it's biased, then 4:1, and so on.

The actual odds bounce around this average. But thanks to the law of large numbers, after $N$ flips the total evidence will be close to $0.19 \cdot N$. <Footnote> More precisely, it's $0.19N \pm O(\sqrt{N})$. Ultimately, we use logs and talk about bits because the law of large numbers works for adding stuff, not multiplying. </Footnote>

Try it yourself! I recommend checking edge cases like 50% vs 51% (to get  intuition about when the law of large numbers kicks in) or what's the difference between 50% vs 1% and 1% vs 50%. 

<EvidenceAccumulationSimulator only_kl_mode={true} />

## 📝 KL divergence <a id="definition-of-kl-divergence"></a>


KL divergence<Footnote>KL stands for Kullback and Leibler, two guys who came up with this in the 1950s, right after Claude Shannon dropped his [game-changing paper](https://en.wikipedia.org/wiki/A_Mathematical_Theory_of_Communication) about entropy. Here's the first exercise: Try saying "Kullback-Leibler divergence" fast three times in a row. </Footnote> is just the general formula for expected evidence accumulation. Say you've got two distributions $p$ and $q$, where $p$ is what's really happening, but you only know it's either $p$ or $q$. 

You can keep sampling from the unknown distribution and play the Bayesian game: Whenever you sample outcome $i$, compare the likelihoods $p_i$ and $q_i$ and update your beliefs. This means adding $\log 1/p_i$ bits to $p$'s surprise total and $\log 1/q_i$ bits to $q$'s. 

On average, each sample from the true distribution $p$ gives you:<Footnote> About notation: Most people write $D_{KL}(p||q)$ instead of $D(p,q)$. The double bars are there to remind you that $D_{KL}(p||q) \not= D_{KL}(q||p)$. We'll keep it simple with $D(p,q)$ since we'll be using this a lot. 🙂 </Footnote>

$$
D(p,q) = \sum_{i = 1}^n p_i \cdot \log \frac{p_i}{q_i}
$$

bits of evidence toward the truth.

When this number is small (less than 1), the model $q$ is a pretty good imposter of $p$ - if you keep adding up surprise for $q$, it's not much worse than the surprise for $p$. 

You can also think of $1/D(p,q)$ as "how many samples until I get one bit of evidence." One bit of evidence means that the odds for the true hypothesis doubled. <Footnote>This isn't the same as doubling the probability. Going from 1:1 to 2:1 odds means 50% → 66.7% probability. But with lopsided odds like 1:1000, gaining a bit toward the underdog (making it 2:1000) almost doubles its probability. And gaining a bit the other way (1:2000) almost halves the underdog's probability. If you keep getting bits of evidence towards the truth, the truth's probability shoots up exponentially until it's comparable to the alternative, then the alternative's probability tanks exponentially. </Footnote>

Notice KL divergence is about the evidence, not your starting beliefs. It tells you how fast beliefs change, no matter where you start. Sometimes, we like to divide statistics into Bayesian and frequentist; KL is useful for both. 


## 🧩 Cracking riddles

<RiddleSolution riddle="independence" id="information-theory">

Back to our riddle: [How do you measure distance from independence](00-introduction#information-theory)?

Remember our three joint distributions $p_1, p_2, p_3$:

![Which table is the "most" independent?](00-introduction/independence.png)

They all have the same marginals (same row and column totals). If the marginals were independent, we'd get this product distribution $q$:

<img src="00-introduction/independence2.png" style={{width: '66%', align: 'center'}} />

Which table is the "most" independent?

We need to measure how different each table is from the ideal independent one. There are more reasonable ways to do this<Footnote>People often use [correlation](https://en.wikipedia.org/wiki/Correlation), but that has problems. First, correlation only works for numbers, not general stuff like \{☀️, ☁️\}. Plus, zero correlation doesn't mean independence. </Footnote>, but using KL divergence is a very principled way to do this. We've got two distributions: the "truth" (one of our tables) and the "model" (the ideal independent table). The KL between them tells us how well the model matches reality—basically, how long until a Bayesian detective figures out the data isn't coming from the independent model.

The KL divergences for our tables:

$$
D(p_1, q) \approx 0.40
$$
$$
D(p_2, q) \approx 0.04
$$
$$
D(p_3, q) \approx 0.21
$$

So table 2 is "closest" to independence!

This works for any joint distribution $(r, s)$. The KL divergence between $(r, s)$ and the independent version $r \otimes s$ is called [mutual information](http://en.wikipedia.org/wiki/Mutual_information) between $r$ and $s$—it's a super-important quantity in information theory.

<MutualInformationWidget /> 

</RiddleSolution>

## 🚀 What's next?

In the [next section](../02-crossentropy), we'll dig deeper into the KL formula and see how it connects to entropy and cross-entropy.





=================================================================================
=================================================================================
CHAPTER: Crossentropy & Entropy
FILE: 02-crossentropy.mdx
=================================================================================
=================================================================================

# KL properties & (cross-)entropy

In this chapter, we'll see how KL divergence can be split into two pieces called _cross-entropy_ and _entropy_. 

<KeyTakeaway>
![Formula for KL divergence](02-crossentropy/crossentropy_entropy_formula.png)
Cross-entropy measures the average surprise of model $q$ on data from $p$. When $p = q$, we call it entropy. 
</KeyTakeaway>




## 🧠 Relative entropy = cross-entropy - entropy

Quick refresher: In the [previous chapter](01-kl_intro), we saw how KL divergence comes from repeatedly using Bayes' theorem with log-space updating:

<BayesSequenceLogWidget highlightSurprisals={true} />

Each step adds surprisals ($\log 1/p$) to track evidence.
Last time, we focused on the differences between surprisals to see how much evidence we got for each hypothesis. Our Bayesian detective just keeps adding up these differences.

But the detective could also add up the total surprisal for each hypothesis (green and orange numbers in the above widget), and then compare overall values. This corresponds to writing KL divergence like this:

<Math id="cross-entropy-decomp" displayMode={true} math='
\underbrace{\sum_{i = 1}^n p_i \log \frac{p_i}{q_i}}_{D(p,q)}
 \;\;\;=\;\;\;
\underbrace{\sum_{i = 1}^n p_i \log \frac{1}{q_i}}_{H(p,q)}
 \;\;\;-\;\;\;
\underbrace{\sum_{i = 1}^n p_i \log \frac{1}{p_i}}_{H(p)}
'/>

These two pieces on the right - $H(p,q)$ is called cross-entropy and $H(p)$ is entropy - are super important. Let's get a feel for what they mean. 

##  ❌ Cross-entropy <a id = "cross"></a>
Think of cross-entropy as _how surprised are you on average when you see data from $p$ and you're modeling it as $q$._ 

Check it out in the widget below. The widget shows what happens when our Bayesian detective from the previous chapter keeps flipping her coin. The red dashed line is showing cross-entropy - the expected surprise of the model $q$ as we keep flipping the coin with bias $p$. The orange line shows the entropy - this is the expected surprise when both the model and actual bias are $p$. 
KL divergence is the difference between cross-entropy and entropy. You can notice that cross-entropy line is always above the entropy line (equivalently, KL divergence is always positive). 



If you let the widget run, you will also see a blue and a green curve - the actual surprise measured by our detective in the flipping simulation. We could also say that these curve measure cross-entropy - it is the cross-entropy between the _empirical distribution_ $\hat{p}$ (the actual outcomes of the flips) and the model $q$ (blue curve) or $p$ (green curve). The empirical crossentropies are tracking the dashed lines due to the [law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers). 


<CrossEntropySimulator />



Bottom line: _better models are less surprised by the data and have smaller cross-entropy. KL divergence is how far our model is from the best one. _

## 🎲 Entropy

The term $H(p) = H(p, p) = \sum_{i = 1}^n p_i \log 1 / p_i$ is a special case of cross-entropy called just plain _entropy_. It's the best possible cross-entropy you can get for distribution $p$—when you model it perfectly as itself.  

Intuitively, entropy tells you how much surprise or uncertainty is baked into $p$. Like, even if you know you're flipping a fair coin and hence $p = q = \frac12$, you still don't know which way the coin will land. There's inherent uncertainty in that, the outcome of the flip still carries some surprise, even if you know the coin's bias. This is what entropy measures. 

The fair coin's entropy is <Math math = "H(\{\textsf{H: }1/2, \textsf{T: }1/2\}) = \frac12\cdot \log2 +  \frac12\cdot \log2 = 1" /> bit. 
But entropy can get way smaller than 1 bit. If you flip a biased coin where heads are very unlikely - say $p(\textsf{H} = 0.05)$ - the entropy of the flip gets close to zero. Makes sense! Sure, if you happen to flip heads, that's super surprising ($\log 1/0.05 \approx 4.32$). However, most flips are boringly predictable tails, so the _average_ surprise gets less than 1 bit. You can check in the widget below that $H(\{\textsf{H}: 0.05, \textsf{T}: 0.95\}) \approx 0.29$ bits per flip. Entropy hits zero when one outcome has 100% probability. 

Entropy can also get way bigger than 1 bit. Rolling a die has entropy $\log_2(6) \approx 2.6$ bits. In general, a uniform distribution over $k$ options has entropy $\log_2 k$—and that's the maximum entropy for any distribution with $k$ options. Makes sense—you're most surprised on average when the distribution is, in a sense, most uncertain.  

<EntropyWidget numCategories={6} title="Entropy of die-rolling" />

<Expand headline = "Example: correct horse battery staple">
Here's an example. Let's say there are about <Math math="2^{11}" /> English words that can be described as 'common'. If you generate uniformly four such common words and make your password the concatenation of them, the total entropy of your password is thus going to be $44$ bits. That's because entropy is a special case of cross-entropy and is thus additive. 

Having a uniform distribution with 44 bits of entropy is just a different way of saying that we have a uniform distribution with $2^{44}$ possible outcomes. 
The following comic wisely teaches us that this many possibilities make it a pretty secure password! Even if an adversary knows how we generated it, cracking it means they have to check about <Math math="2^{44}" /> passwords. 

<a href="https://xkcd.com/936/" target="_blank" rel="noopener noreferrer">
  <img src="02-crossentropy/password.png" alt="password" style={{cursor: 'pointer'}} />
</a>
</Expand>

<Expand headline = "Conditional entropy" advanced={true}>

Let's go back to the mutual information that we [encountered in the first chapter](01-kl_intro/information-theory). This is a formula that we can apply to a joint distribution $(X,Y)$:

<Math displayMode={true} math="I(X;Y) = D((X,Y), X \otimes Y)" />

Intuitively, mutual information tells us how many bits we learn about $X$ when we find out the value of $Y$ (or vice versa—it's symmetric). This can be formalized using entropy. 

First, recall the entropy formula $H(X) = \sum_{x} P(X = x) \log \frac{1}{P(X = x)}$. This formula still works if we condition on knowing that $Y$ takes a certain value $y$. We can write
<Math displayMode={true} math="H(X | Y = y) = \sum_{x} P(X = x | Y = y) \log \frac{1}{P(X = x | Y = y)}" />
The conditional entropy $H(X|Y)$ is defined as the entropy of $X$ after I sample $Y$ and learn its value, i.e.:
<Math displayMode={true} math="H(X|Y) = \sum_{y} P(Y = y) H(X | Y =y)" />

Conditional entropy has some nice properties. One of them is that $H(X|Y) \le H(X)$. That is, learning the value of $Y$ is on average only decreasing the uncertainty about $X$. In fact, the difference between the two is exactly the mutual information!

<Math displayMode={true} math="I(X;Y) = H(X) - H(X|Y)" />
It is a good exercise to write down all the definitions to check that this is true. To get some intuition about this, guess what happens if we make $P$(☀️ AND 🚶‍♀️$) = P$(☁️ AND 🚲$) = \frac{1}{2}$ in the widget below.  

<MutualInformationWidget />

The mutual information is then 1 bit. That's because learning the value of one distribution, say transport, makes the entropy of weather smaller by 1 bit - the weather distribution changes from a coin flip ($H(\textrm{weather}) = 1$) to either determined ☀️ or determined ☁️ ($H(\textrm{weather} | \textrm{transport}) = 0$). 

</Expand>


## 🔐 Relative entropy
KL divergence can be interpreted as the gap between cross-entropy and entropy. It tells us how far your average surprise (cross-entropy) is from the best possible (entropy). 
That's why in some communities, people call KL divergence the _relative entropy_ between $p$ and $q$. <Footnote>Way better name than 'KL divergence' if you ask me. But 'KL divergence' is what most people use, so I guess we're stuck with it. </Footnote>

## 🧩 Cracking riddles

Splitting a sum into two parts isn't exactly rocket science—the real win is that cross-entropy and entropy are super meaningful concepts on their own. Let's see this in action. 

<Expand headline = "🔮 How good are your predictions?"> <a id="application-evaluating-predictions"></a>

Time to solve our [prediction riddle](00-introduction#predictions). We asked experts to predict future events—how do we score them?

### Idealized KL score

To grade predictions, let $p = (p_1, \dots, p_n)$ be the true probabilities of the events we ask our experts about, and $q$ be what the expert predicted. It for sure seems like a good idea to give the expert the following score:

<Math displayMode={true} math="S_{KL}(q) = D(p,q)" />

That is, we know that KL divergence is measuring how well a model $q$ matches the reality $p$, so we just use this a score for the expert - the lower score the better. 

If all $n$ events are independent,<Footnote>They of course never are, but here we will always assume they are. </Footnote> this formula becomes:

<Math displayMode={true} math="S_{KL}(q) = \sum_{i = 1}^n  \left(
    p_i\log\frac{p_i}{q_i} + (1-p_i)\log\frac{1-p_i}{1-q_i}
    \right)" />


But wait—there's a huge problem with this score. Can you spot it?

### 🎯 Cross-entropy score

The problem: we have no clue what the "true" probabilities are! <Footnote> We could go down a philosophical rabbit hole about whether "true" probability even is even a meaningful concept. But let's not. </Footnote>

All we know is what actually happened. This gives us an empirical distribution $\hat{p}$ where each $\hat{p}_i$ is either 0 or 1—it's all concentrated on the one outcome we saw.

What happens when we plug $\hat{p}$ into our KL score? Since $\hat{p}$'s entropy is zero (one outcome, no uncertainty), cross-entropy and relative entropy are the same: 

<Math displayMode={true} math="
S_{CE}(q) =
\sum_{i = 1}^n  \left(
    \hat{p}_i\log\frac{1}{q_i} + (1-\hat{p}_i)\log\frac{1}{1-q_i}
    \right)
"/>

This is why this formula is often called the _cross-entropy score_, though forecasting community calls it the [Log-score](https://forecasting.wiki/wiki/Log_score). 

### 🔗 Connection to the idealized score
Let's dig into how cross-entropy score relates to our idealized KL score. Technically, cross-entropy score is a random variable—it depends on which outcomes actually happen. Each $\hat{p}_i$ is 1 with probability $p_i$, otherwise 0.

So what's the expected cross-entropy score? Since $E_p[\hat{p}_i] = p_i$, linearity of expectation gives us:

<Math displayMode={true} math="
E_p[S_{CE}(q)] =
\sum_{i = 1}^n  \left(
    p_i\log\frac{1}{q_i} + (1-p_i)\log\frac{1}{1-q_i}
    \right)
"/>

In other words, <Math  math="E_p[S_{CE}(q)] = H(p,q)"/>. Nice! Give experts lots of questions, and by the law of large numbers, their score will approach the cross-entropy $H(p,q)$ between the true distribution and their guess. This is analogous to how [in the cross-entropy widget above](#cross), the blue line is different each time you run the experiment (it is random variable), but it tracks the dashed red line (the law of large numbers). 

Now remember:
<Math id="entropy-relation" displayMode={true} math="D(p,q) = H(p,q) - H(p)" />
We can't compute $D(p,q)$ directly, but here's the key insight: for two experts with predictions $q_1, q_2$, we have $D(p,q_1) < D(p, q_2)$ if and only if $H(p, q_1) < H(p, q_2)$. They only differ by $H(p)$, which doesn't depend on the experts' predictions. So:

_Comparing experts by cross-entropy is just as good as comparing by KL divergence in the long run!_

<Expand headline="Example: Coin flipping">
Let's make this concrete. We flip a fair coin $N$ times ($p_1 = \dots = p_N = 1/2$). Expert 1 nails it ($q_1 = \dots = q_N = 1/2$), while Expert 2 is a bit off ($q'_1 = \dots = q'_N = 0.6$).

The idealized KL scores: $KL(p, q) = N \cdot 0 = 0$ and $KL(p, q') = N \cdot D(p_1, q'_1) \approx 0.03 \cdot N$.

We can't see these scores, but we can compute cross-entropy. For large $N$, the law of large numbers says the scores will be roughly $H(p,q) = N$ and $H(p, q') \approx 1.03 \cdot N$. Both are bigger by $H(p) = N$—the inherent uncertainty of coin flips. Even the perfect expert gets a high score! But since both shift by the same amount, cross-entropy still picks the best expert just like KL would. 

Key point: this only works _in the long run_. With just 8 predictions, any scoring is pretty noisy. 
</Expand>

Try the log-score on our example! Also, you can compare it with other popular score called brier score, which is just the so-called mean squared error or $\ell_2$ metric (i.e., if you predicted 0.8 probability and the event happens, your score is $(1-0.8)^2 = 0.04$). Brier score does not really care whether your failed prediction had probability of $0.9$ or $0.9999$. 

<ExpertRatingWidget
    title="Comparing Scoring Methods"
    showBrierScore={true}
  />

</Expand>


## 🚀 What's next? <a id="next-steps"></a>

We're getting the hang of KL divergence, cross-entropy, and entropy! Quick recap:

![Formula for KL divergence](02-crossentropy/crossentropy_entropy_formula.png)

In the [next chapter](03-entropy_properties), we will do a recap of what kind of properties these functions have. 




=================================================================================
=================================================================================
CHAPTER: Entropy properties
FILE: 03-entropy_properties.mdx
=================================================================================
=================================================================================

# Entropy properties

In this chapter, we'll go over the fundamental properties of KL-divergence, entropy, and cross-entropy. We have already encountered most of the properties before, but it's good to understand them in more depth. 

This chapter contains a few exercises - I encourage you to do them to check that you're on board. 

<KeyTakeaway>
KL divergence $D(p,q)$ is always nonnegative. Equivalently, $H(p, q) \ge H(p)$.  
</KeyTakeaway>



## 🔍 KL divergence can blow up


Remember, KL divergence is algebraically defined like this:

<Math id="kl-definition" displayMode={true} math="D(p,q) = \sum_{i = 1}^n p_i \log \frac{p_i}{q_i}" />

Here's the biggest difference between KL and some more standard, geometrical, ways of mesuring distance like $\ell_1$ norm ($\sum |p_i - q_i|$) or $\ell_2$ norm (<Math math = "\sqrt{\sum (p_i - q_i)^2}" />). Take these two possibilities. 

1. $p_i = 0.5, q_i = 0.49$
2. $p_i = 0.01, q_i = 0.0$

Regular norms ($\ell_1, \ell_2$) think that the errors made by $q$ are about the same size. But KL knows better: The first situation is basically fine, but the second model $q$ is a total disaster! For example, letters "God" typically do not follow with "zilla", but any model of language should understand that this _may_ sometimes happen. If $q(\textrm{'zilla'} \mid \textrm{'God'}) = 0.0$, the model is going to be infinitely surprised once 'Godzilla' comes! 


Try to make KL divergence infinite in the following widget. Next level: Try to make it infinite while keeping $\ell_1$ and $\ell_2$ norm close to zero (say $< 0.1$). 

<DistributionComparisonWidget title="KL Divergence Explorer" />



## ⚖️ KL divergence is asymmetrical<a id = "asymmetry"></a>

The KL formula isn't symmetrical—in general, $D(p,q) \neq D(q,p)$. Sometimes, this is described as a disadvantage, especially when comparing KL to simple symmetric distance functions like $\ell_1$ or $\ell_2$. But I want to stress that the asymmetry is a feature, not a bug! KL measures how well a distribution $p$ is fitted by a model $q$. That's an asymmetrical thing by nature, so we need an asymmetrical formula—nothing to be embarrassed about.

In fact, that's why people call it a [_divergence_](https://en.wikipedia.org/wiki/Bregman_divergence) instead of a distance. Divergences are kind of wonky distance measures that are not necessarily symmetric.



<Block headline = "Example">
Imagine the true probability $p$ is 50%/50% (fair coin), but our model $q$ says 100%/0%. KL divergence is ... 
<Math displayMode={true} math = "\frac12 \cdot \log \frac{1}{1} + \frac12 \cdot \log \frac{1}{0} = \infty"/>

... infinite. That's because there's a 50% chance that we gain infinitely many bits of evidence towards $p$ (our posterior jumps to 100% fair, 0% biased).

Now flip it around: truth is 100%/0%, model is 50%/50%. Then 
<Math displayMode={true} math = "1 \cdot \log \frac{1}{1/2} + 0 \cdot \log \frac{1}{1/2} = 1"/>
Every flip gives us heads, so we gain one bit of evidence that the coin is biased. As we keep flipping, our belief in fairness drops exponentially fast, but it never hits zero. We've gotta account for the (exponentially unlikely) possibility that a fair coin just coincidentally came heads in all our past flips.
</Block>

Here's a riddle for you! The following widget contains two distributions - one peaky and one broad. Which KL is larger? <Footnote>KL divergence also works for continuous distributions; just replace sum by integral. More on that [later](04-minimizing#maximum-entropy-principle). </Footnote>

<KLAsymmetryVisualizerWidget />


## ✅ KL is nonnegative

If you plug in the same distribution into KL twice, you get:

<Math displayMode={true} math="D(p, p) = \sum_{i = 1}^n p_i \cdot \log \frac{p_i}{p_i} = 0" />

because $\log 1 = 0$.
Makes sense—you can't tell the truth apart from the truth. 🤷

This is pretty much the only occasion on which KL can be equal to zero. Otherwise, KL divergence is always positive. This fact is sometimes called [Gibbs inequality](https://en.wikipedia.org/wiki/Gibbs%27_inequality). I think we built up a pretty good intuition for this in the last chapter. Just imagine sampling from $p$ but Bayes' rule somehow convinces you more and more that you are sampling from ... some other distribution $q$? That would be really messed up! 

This is not a proof though, just an argument that the world with possibly negative KL is not worth living in. Check out the formal proof if you're curious.

<Expand headline="Proof of nonnegativity">
We'll use natural logarithm to keep things short. We want to prove that <Math math = "D(p,q) =  \sum_{i = 1}^n p_i \cdot \ln \frac{p_i}{q_i}  \ge 0" /> for any $p,q$. 

Let's estimate what's inside the sum: $\ln \frac{p_i}{q_i}$. Since we know the inequality is tight when $p_i = q_i$, we need an estimate of logarithm that's tight around 1. The best linear approximation near 1 is $\ln (1+x) \le x$. We use it like this:

<Math displayMode={true} math="\begin{aligned}
-D(p,q)
&= \sum_{i = 1}^n p_i \cdot \ln \frac{q_i}{p_i}\\
&\le \sum_{i = 1}^n p_i \cdot  \left( \frac{q_i}{p_i} - 1 \right)\\
&= \sum_{i = 1}^n \left( q_i - p_i \right)\\
&= 1 - 1 = 0
\end{aligned}" />

</Expand>

Since KL can be written as the difference between cross-entropy and entropy, we can equivalently rewrite $D(p, q) \ge 0$ as
<Math displayMode = {true} math = "H(p, q) \ge H(p)." />
That is, the best model that accumulates the surprisal at the least possible rate is ... 🥁 🥁 🥁 ... the actual distribution generating the data. 


### ➕ Additivity

Say you've got two distribution pairs $(p, q)$ and $(p', q')$. Let's use $p \otimes p'$ for the product distribution -- a joint distribution over $p,p'$ where they are independent. We have:

<Math displayMode={true} math="D(p \otimes p', q \otimes q') = D(p, q) + D(p', q')" />
<Math displayMode={true} math="H(p \otimes p', q \otimes q') = H(p, q) + H(p', q')" />
<Math displayMode={true} math="H(p \otimes p') = H(p) + H(p')" />

This is called additivity. Basically, when we keep flipping coins, the total entropy/cross-entropy/relative entropy just keeps adding up. This property is so natural that it's very simple to forget how important it is. We've used this property implicitly in earlier chapters, whenever we talked about repeating the flipping experiment. 

<Expand headline="Chain rule & uniqueness" advanced={true}>
There's also a slightly fancier version of additivity called the _chain rule_. 


Say I've got distributions $p,q$ for how I get to work (\{🚶‍♀️, 🚲, 🚌\}). But when I take the bus, I also track which line (\{①, ②, ③\}), with conditional distributions $p', q'$. Combining $p$ and $p'$ gives me an overall distribution <Math math = "p_{\textrm{overall}}" /> over \{🚶‍♀️, 🚲, ①, ②, ③\}. 

For example, if $p=$\{🚶‍♀️: 0.3, 🚲: 0.3, 🚌: 0.4\} and $p'=$\{①: 0.5, ②: 0.25, ③: 0.25\}, then <Math math = "p_{\textrm{overall}}=" />\{🚶‍♀️: 0.3, 🚲: 0.3, ①: 0.2, ②: 0.1, ③: 0.1\}. 

The chain rule says:

<Math displayMode={true} math="
D(p_{\textrm{overall}}, q_{\textrm{overall}}) = D(p,q) + p_{\textrm{bus}} \cdot D(p',q')
"/>
where <Math math = "p_{\text{bus}}" /> is how often I take the bus according to $p$. 

This is pretty intuitive! First off, as we refine our distributions, the divergence gets larger. In other words, telling $p_{overall}$ apart from $q_{overall}$ is easier than just telling $p$ from $q$. 

But the formula even tells us very precisely how much: the bus refinement helps by $D(p', q')$ whenever bus comes up. This happens with probability <Math math = "p_{\textrm{bus}}" />. 

Try proving this yourself or see how it gives us additivity! 

Here's something cool: any reasonable function with monotonicity and chain rule properties [has to be KL divergence](https://blog.alexalemi.com/kl.html).

That's pretty awesome—it means KL divergence isn't some arbitrary formula someone cooked up. There's literally only one measure with these natural properties, and it's KL divergence.


</Expand>



## 🎵 Anthem battle

I collected anthems of USA, UK, and Australia, and put them into one file. The other text file are anthems of a bunch of random-ish countries. For both text files, I compute the frequencies of 26 letters 'a' to 'z'. So there are two distributions $p_1$ (English-speaking) and $p_2$ (others). The question is: which one has larger entropy? And which of the two KL divergences between them is larger? 

Have a guess before clicking on the button. 

<KLCalculatorWidget /> 








## 🚀 Next steps

We now understand pretty well what KL divergence and cross-entropy stand for. In the next part of the mini-course, we will have a lot of fun thinking about what happens if we try to make them small. See you in the [next chapter](03-minimizing)!


################################################################################
PART II: OPTIMIZATION
################################################################################

=================================================================================
=================================================================================
CHAPTER: Minimizing KL
FILE: 04-minimizing.mdx
=================================================================================
=================================================================================

# Minimizing KL divergence <a id="updating-beliefs"></a>

In this chapter, we'll explore what happens when we minimize the KL divergence between two distributions. Specifically, we'll look at two distinct scenarios:

1.  We begin with a distribution $p$ and aim to find a simpler model for it from a family of distributions $Q$. This can be achieved by minimizing $D(p, q)$ over all $q \in Q$. Special case of this is the _maximum likelihood principle_ (MLE) in statistics.

2.  Alternatively, if we start with a distribution $q$ and learn that the true distribution comes from some family $P$, we find a better model by minimizing $D(p, q)$ over all $p \in P$. Special case of this is _the maximum entropy principle_ in statistics.

Let's dive into the details!

<KeyTakeaway>
Maximum likelihood and maximum entropy principles are about minimizing KL divergence. 
</KeyTakeaway>

## 🎯 Simplifying models by minimizing KL <a id="mle"></a>

Imagine we have some data—for instance, the 16 foot length measurements $X_1, \dots, X_{16}$ from [our statistics riddle](00-introduction#statistics). Assuming the order of the data doesn't matter, it's convenient to represent these data as an empirical distribution $p$, where each outcome is assigned a probability of $1/16$. This is what we call an _empirical distribution_. In some sense, this empirical distribution is the "best fit" for our data. However, it's a terrible predictive model—it assigns zero probability to outcomes not present in the data! If we were to measure the 17th person's foot, the model is "infinitely surprised" by this. We need something better.

![fit](04-minimizing/fit.png)

One common approach is to first identify a family of distributions $Q$ that we believe would be a good model for the data. For example, we might suspect that foot lengths follow a Gaussian distribution.<Footnote>Why Gaussians? We'll see soon.</Footnote> In this case, $Q$ would be the set of all Gaussian distributions with varying means and variances. 

Visually, you can think of a "potato" representing all possible distributions, with $p$ as a single point within it. $Q$ would then be a subset, perhaps resembling a half-plane, as it's parameterized by two values: $\mu$ and $\sigma^2$. I like to draw pictures like the one below, though it's of course a dangerous business -- we don't have any kind of [way of measuring distance](https://en.wikipedia.org/wiki/Metric_space) between different distributions. 

![KL divergence potato](04-minimizing/potato_mle.png)

Now, let's assume we believe a normal distribution is a suitable model for this data. How do we pinpoint the optimal parameters $\mu$ and $\sigma^2$ to best match the empirical distribution? KL divergence offers a natural solution: Choose $\mu$ and $\sigma$ to minimize $D(p, N(\mu,\sigma^2))$<Footnote> $N(\mu, \sigma^2)$ denotes the Gaussian with mean $\mu$ and variance $\sigma^2$. </Footnote>. More broadly, if we have a collection of candidate distributions $Q$ (like all Gaussians), we select the $q\in Q$ that minimizes $D(p,q)$.

<Math displayMode={true} math = "q_{new} = \argmin_{q\in Q} D(p, q)" />

Why does this make sense? Recall that KL divergence is designed to measure how well a model $q$ approximates the true distribution $p$. More specifically, it is the rate of how quickly a Bayesian detective learns that the true distribution is $p$, not $q$. So, minimizing KL simply means selecting the best "imposter" that it takes the longest to separate from the truth. That's pretty reasonable!

### 🔍 Maximum likelihood principle <a id="mle"></a>

Let's examine our approach of minimizing $D(p, q)$ more closely. We'll focus on the most common scenario where $p$ is an empirical distribution derived from data points $X_1, \dots, X_n$. To keep the notation tidy, let's assume all $X_i$ are distinct, which means that $p$ is uniform distribution<Footnote>In the general case, $p$ is not necessarily uniform and the probability of each value $x$ is proportional to the count of $x$ in the data. The general case does not change much in the argument we are about to make. </Footnote>. In this situation, we can express the KL divergence we're minimizing as:

<Math displayMode={true} math="D(p,q) = \sum_{X_i\in\mathcal{X}} \frac{1}{n}\log\frac{1/n}{q(X_i)}. " />

Splitting this into entropy and cross-entropy terms:

<Math displayMode={true} math="D(p,q) = \sum_{X_i\in\mathcal{X}} \frac{1}{n}\log\frac{1}{q(X_i)} - \sum_{X_i\in\mathcal{X}} \frac{1}{n}\log\frac{1}{n}. " />

Notice that the entropy term (the second sum) remains constant with respect to $q$. <Footnote> In this specific case, where $p$ is a uniform distribution, we even have $\sum \frac{1}{n}\log n = \log n$, but the key point is that it's a constant independent of $q$. </Footnote> Therefore, minimizing KL divergence is equivalent to minimizing the cross-entropy:

<Math displayMode={true} math="\argmin_{q\in Q} D(p, q) = \argmin_{q \in Q} \sum_{X_i\in\mathcal{X}} \frac{1}{n}\log\frac{1}{q(X_i)}" />

Here, $q(X_i)$ represents the probability (or probability density) that the model assigns to the data point $X_i$. If we drop the constant factor $1/n$ and use the identity $\log(1/x)=-\log x$, this minimization becomes equivalent to maximizing the following product:

<Math displayMode={true} math="\argmin_{q\in Q} D(p, q) =  \argmax_{q \in Q} \prod_{X_i} q(X_i)" />

The right-hand side expression has a very clear interpretation: it's the conditional probability of observing the data $X_i$, assuming they were sampled independently from the model distribution $q$. This type of conditional probability is also known as the "likelihood of $X$ under $q$".

So, what's the big takeaway? Minimizing KL divergence for empirical distributions is equivalent to maximizing the likelihood of the data under the model $q$. The latter is actually a very common technique in statistics, known as the maximum likelihood estimation (MLE) principle. We've just derived it from the perspective of KL divergence!

<Expand headline = "Example: Maximum likelihood for Normal Distribution">
<a id = "mle_for_mean_sigma"></a>

Suppose we are given data $X_1, \dots, X_N$ (which we represent by its empirical distribution $p$) and want to find the best-fitting Gaussian $N(\mu, \sigma^2)$. How should we choose $\hat\mu$ and $\hat\sigma^2$?

The Maximum Likelihood Principle suggests that we should maximize the likelihood, or, more conveniently, maximize the log-likelihood (which is equivalent to minimizing the cross-entropy):

<Math displayMode={true} math="\hat\mu, \hat\sigma^2 = \argmax_{\mu, \sigma^2} \sum_{i = 1}^N \log\left( \frac{1}{2\pi\sigma^2} e^{-\frac{(X_i-\mu)^2}{2\sigma^2}} \right) 
= \argmin_{\mu, \sigma^2} 2N \cdot \log \sigma + \sum_{i = 1}^N \frac{(X_i-\mu)^2}{2\sigma^2}"/>

There are several ways to solve this optimization problem. Differentiation is likely the cleanest: If we define $\mathcal{L}$ to be the expression above, then:
<Math displayMode={true} math = "\frac{\partial \mathcal{L}}{\partial \mu} = \frac{1}{\sigma^2} \sum_{i = 1}^N 2(X_i - \mu) "/>

Setting <Math displayMode={false} math="\frac{\partial \mathcal{L}}{\partial \mu} = 0"/> leads to $\hat\mu = \frac{1}{N} \sum_{i = 1}^N X_i$.

Similarly,
<Math displayMode={true} math="\frac{\partial \mathcal{L}}{\partial \sigma} = 2N/\sigma -2  \sum_{i = 1}^N \frac{(X_i-\mu)^2}{\sigma^3}"/>

Setting <Math displayMode={false} math="\frac{\partial \mathcal{L}}{\partial \sigma} = 0"/> then leads to <Math displayMode={false} math="\hat\sigma^2 = \frac{1}{N} \sum_{i = 1}^N (X_i - \mu)^2. "/>
</Expand>

## 💪 Conditioning on steroids <a id="finding-better-model"></a>

So, minimizing <Math math="\min_{q \in Q} D(p,q)" /> is quite useful. But what about the other direction, <Math math="\min_{p \in P} D(p,q)" />? This is also extremely valuable, so let's explore an example of what it stands for.

Suppose I want to determine a probability distribution modelling the random variable $X$ of how long it takes me to eat lunch. My initial (and very crude) model of $X$ might be a uniform distribution $q$ between <Math math="0" /> and <Math math="60" /> minutes.

Starting with this model, I can try to get some new information and condition on it to get a better model $p$. 

For example, let's say that after eating many lunches, I observe that I always finish after at most 30 minutes. I can turn this to a new information that $X \le 30$. I can condition on this information and get a better model:

![conditioning](04-minimizing/condition.png)

Let's try again. I eat many more lunches, but this time I keep recording the average time it takes me to eat lunch. Say, it turns out to be 15 minutes. How do I change $q$ to reflect this new information? The probability theory gives a clear answer.

![syntax-error](04-minimizing/syntax_error.png)

We simply can't do this. In probability theory, we can condition on events like $X \le 30$, i.e., facts that are true for some values $X$ can attend but not others. But now we would like to condition on $E[X] = 15$ which is not an event, just a fact that's true for some _distributions_ over $X$. 

The fun part is that we can use KL divergence to 'condition' on $E[X] = 15$. I propose that the correct way to account for the new information is to choose <Math math = "p_{\textrm{new}}" /> as the model minimizing KL divergence to $q$. That is, for the set $P$ of distributions $p$ with $E_p[X] = 15$, choose
<Math id="min-relative-entropy" displayMode={true} math = "p_{\textrm{new}} = \argmin_{p\in P} D(p, q)" />

This is sometimes called [the minimum relative entropy principle](resources#intermediate-resources). Why does this make sense? Intuitively, I want to find a distribution <Math math="p \in P" /> such that <Math math="q" /> remains as good a model of it as possible. This is precisely what we achieve by minimizing KL divergence.

![max-ent](04-minimizing/max_ent_example.png)

Admittedly, this intuition feels a bit shakey, as we typically prefer $p$ to represent the "true" distribution when using KL divergence, whereas here it's simply a new, improved, model. Fortunately, it is possible to justify the minimum relative entropy principle directly from Bayes' rule. Choosing <Math math="p_{\textrm{new}}" /> by <EqRef id="min-relative-entropy" /> turns out to be equivalent to "updating a model $q$ to incorporate new evidence that the model should be from $P$, using Bayes' rule." This is called [Wallis derivation](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy#The_Wallis_derivation). 

<Expand headline="Detailed discussion of Wallis derivaiton" advanced={true}>
The following argument is a version of the so-called [Wallis derivation](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy#The_Wallis_derivation). 
We will reformulate our setup slighlty to sidestep the "syntax-error" issue and to be able to condition on facts of the type "our model distribution should come from the set $P$". 

Imagine we start with some distribution $q$ and sample from it $N$ times. We'll use $\hat{q}$ to denote the empirical distribution of these samples. The Wallis trick is to realize that $\hat{q}$ is no longer a simple distribution, it's a distribution over distribution (also called a mixture distribution). For $\hat{q}$, it now makes sense to ask questions such as whether $\hat{q}$ belongs to some family of distributions $P$ (e.g., all distributions with an average of 15). 


Our plan is to imagine a very large $N$ and the process of generating $\hat{q}$ from $q$. We then condition the distribution of $\hat{q}$ on the fact that $\hat{q} \in P$ to obtain the posterior distribution. We will argue the following claim: _As $N$ approaches infinity, the posterior distribution will become concentrated on the distribution $p \in P$ that minimizes $D(p,q)$_. This provides the justification for the minimum relative entropy principle. The methodology is essentially equivalent to saying "If I keep my model $q$, but inexplicably, the data actually is from a set $P$, then I can as well model the data by <Math math = "\argmin_{p \in P} D(p,q) " />. 

Let's prove the claim.

First, a bit of notation: Think of $\hat{q}$ as a [random vector](https://en.wikipedia.org/wiki/Multivariate_random_variable) whose randomness stems from the choice of the $N$ samples from $q$. Let $P_0$ be the space of all random vectors <Footnote>More precisely, $P_0$ should be chosen as the space of all distributions where probabilities are multiples of $1/N$, but let's not get bogged down in technicalities.</Footnote> - we are given its subset $P$ from which the new model shall be picked. Here's a picture:

![Wallis derivation](04-minimizing/wallis.png)

We now need to understand the distribution of $\hat{q}$, i.e., we want to understand the probability $P(\hat{q} = p)$ for $p \in P_0$. There are two ways to do this.

1.  We can write it down exactly (<Math math="P(\hat{q} = p) = {N \choose p_1N, \dots, p_kN}\cdot \prod_{i = 1}^k q_i ^ {p_i N}" />) and solve it (using Stirling's approximation, we have <Math math="P(\hat{q} = p) \approx 2^{H(p)\cdot N}" /> and thus <Math math="P(\hat{q} = p) \approx 2^{-D(p,q)\cdot N}" />).

2.  If you prefer to see the underlying algebra, we can revisit the [first chapter](01-kl_intro#expected-distinguishing-evidence) where our Bayesian friend was essentially trying to compute the probability we now need. More concretely, if our friend obtained $N$ samples and the empirical distribution was $p$, all the evidence supporting a hypothesis $q$ summed up to the value $N \cdot H(p, q)$. The meaning of this evidence is that the probability <Math math="P(\hat{q} = p)" /> must be proportional to <Math math="2^{-N \cdot H(p, q)}" />; we just don't know the normalization constant.

Now, with a bit of hand-waving, we can observe that the probability distribution of <Math math="\hat{q}" /> will be concentrated around the value of $q$ as $N$ approaches infinity, even though there's a nonzero probability that $\hat{q} \in P$. If that happens, we similarly find that the posterior distribution is concentrated around the value <Math math="\tilde{p} = \argmin_{p \in P} D(p,q)"/>. We conclude that in the limit of $N$ going to infinity, working with mixture distributions and conditioning on it being from $P$ is equivalent to simply replacing $q$ with <Math math="\argmin_{p \in P} D(p,q)"/>.


As a final note (unrelated to Wallis derivation), to justify the inuition that minimum relative entropy principle extends conditioning, we have to check carefully that conditioning is really a special case of minimizing KL. The fact that you have to prove (and it's a good exercise!) is this: If you have a joint distribution $p$ over two random variables $X,Y$ and learn that $Y = y$, there are two things you could do. 1) Define distribution $p_1$ by conditioning $p$ on $Y = y$. 2) Define distribution $p_2$ as <Math math = "\argmin_{p'} D(p', p)$." />. You should prove that $p_1 = p_2$. 

</Expand>


{/*
<Expand headline = "Min relative entropy implies Bayes' updating" advanced={true}>
One more technical point. We should confirm that we can view classical updating as a special case of the min relative entropy principle. This justifies the intuition that minimum relative principle is "conditioning on steroids". 


Consider the general problem of updating after seeing evidence: We have a joint distribution <Math math = "p_{old}" /> over two random variables $X$ (which we're interested in) and $Y$ (representing possible evidence we might observe).
Then, we observe some evidence $Y=y$. We want to compute the new distribution <Math math = "p_{new}" /> that incorporates this observation. The rules of conditional probability say that <Math math = "p_{new}" /> should be $0$ for $Y \not= y$ and, for $Y = y$, it should be the conditional distribution of $p$ given $Y = y$.

The observation we can now make is that <Math math="p_{new} = \argmin_{p \in P} D(p, p_{old})" />, where $P$ is the set of distributions where $P(Y = y') = 0$ for $y' \ne y$<Footnote>The proof of this observation requires some rewriting, but in essence, it hinges on the fact that the distribution closest in KL to $p$ conditioned on $Y = y$ is... the same distribution. Really, nothing complicated is happening here; we are just saying that the new distribution should resemble the old one, merely rescaled so that probabilities sum to one.</Footnote>.
</Expand>
*/}

### ⚫ The maximum entropy principle <a id="maximum-entropy-principle"></a>

Let's delve deeper into the minimum relative entropy principle. A conceptual issue with it is that it only allows us to refine an existing model $q$ into a better model $p$. But how did we choose the initial model $q$ in the first place? It feels a bit like a chicken-and-egg dilemma.

Fortunately, there's usually a very natural choice for the simplest possible model $q$: the uniform distribution. This is the unique distribution that assigns the same probability to every possible outcome. In a sense, it's the most "even" distribution we can possibly have. This argument for the uniform distribution is known as the [principle of indifference](https://en.wikipedia.org/wiki/Principle_of_indifference).

So, it would be highly interesting to understand what happens when we start with the uniform distribution $q$ (say, over a discrete set $\{1, \dots, k\}$) and find a better model <Math math = "p_{new} \in P" /> by minimizing KL divergence. Let's write it out:

<Math displayMode={true} math="p_{new} = \argmin_{p \in P} D(p,q_{\textrm{uniform}}) = \sum_{i = 1}^k p_i \log \frac{p_i}{ 1/k}" />

After splitting the KL divergence into entropy and cross-entropy, we can rewrite this as:

<Math displayMode={true} math="D(p,q_\text{uniform}) = \sum_{i = 1}^k p_i\log p_i - \sum_i p_i\log (1/k)" />

Since the second term is a constant (specifically, equal to $-\log (1/k) = \log(k)$), minimizing KL divergence is equivalent to maximizing the negative of the first term, which is simply the entropy of $p$:

<Math displayMode={true} math="p_{new} = \argmin_{p \in P} D(p, q_{\textrm{uniform}}) = \argmax_{p\in P} H(p)" />

We've just derived what's known as the [maximum entropy principle](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy): given a set $P$ of distributions to choose from, we should opt for the $p\in P$ that maximizes its entropy $H(p)$.

<Expand advanced={true} headline = "Working with Continuous Distributions">

Sometimes we need to use entropy and KL divergence for continuous distributions. For KL divergence, not much changes. We just replace the sum with an integral and write:
<Math displayMode={true} math = "D(p, q) = \int_x p(x) \log \frac{p(x)}{q(x)} dx. " />

For entropy, it's a bit trickier. To understand what's happening, let's remember what an integral intuitively represents. For example, a continuous uniform distribution over the interval $[0,1]$ is, in some sense, a limit of discrete distributions, where the $n$-th distribution in the sequence is the uniform distribution over <Math math = "\{\frac{1}{n}, \dots, \frac{n}{n}\}"/>. 


![uniform](04-max_entropy/unif.png)

When we use integral formulas like the one above for KL divergence, it's justified by _convergence_: If we discretize the real line into buckets of length $1/n$ and compute KL divergence, then as $n$ increases, the discretized results will converge to the integral's value (unless $p,q$ are some wild functions).

The problem with entropy is that it doesn't converge. Indeed, the entropy of a uniform distribution with $n$ options is $\log n$. If $n$ goes to infinity, $\log n$ goes as well, hence the entropy of a continuous uniform distribution is infinite. This makes sense! If I sample a real number from [0,1], there is infinite surprise in what I see. I also can't store the number on my disk since there are infinitely many bits to store.

What does this mean for the principle of maximum entropy? If this principle was purely about entropy, we'd be in trouble. But, thankfully, we now understand that it is fundamentally about _minimizing KL divergence_ between $p$ and a model distribution, which, in the case of the max entropy principle, is the uniform distribution.

So, let's write down the formula for KL between $p$ and the uniform distribution. Since the uniform distribution does not exist for real numbers, let's use the interval $[-C, C]$ as the support; $C$ is some large number. We get: 
<Math displayMode={true} math = "D(p, q_{uniform}) = \int p(x) \log \frac{p(x)}{1/(2C)} dx = \log (2C) + \int p(x) \log p(x) dx." />
That is, in the continuous case, the minimum relative entropy principle boils down to maximizing the expression $\int p(x) \log \frac{1}{p(x)} dx$. This holds for any constant $C$, so we might as well use the principle also in the limit when $x$ ranges over all real numbers. 

So, after all this discussion, generalizing the minimum relative entropy trick to continuous distributions still boils down to replacing $\sum$ with $\int$ and maximizing $\int p(x) \log \frac{1}{p(x)} dx$. This integral expression is called [differential entropy](https://en.wikipedia.org/wiki/Differential_entropy) so it looks like it's basically the same thing as our entropy formula for discrete distributions. In the main text, I am also calling this expression implicitly "the entropy" so as not to scare normies.

On the first glance, that does not seem to be too big of an imprecision. In fact, when Shannon - the information theory [GOAT](https://www.dictionary.com/e/slang/g-o-a-t/) - defined entropy in his landmark paper, he just mentioned in passing something like "and to generalize entropy to continuous distributions, just replace sum by integral". 

It took some time before people got to know better and realized that this is all a bit more subtle than what it looks like and the fact that we can use differential entropy is a bit of a lucky coincidence. The key to not get confused is to understand that it is the _relative entropy_, i.e., KL divergence that generalizes to continuous distributions. Entropy is infinite. Thus, we can replace entropy with differential entropy in our maximum entropy principle _only because the argument is ultimately about KL divergence to the uniform distribution_!    
</Expand>


<Expand headline = "Example: Gaussian Distribution">
Here's an example of how the maximum entropy principle can be applied. Let's say we want to model some real-valued data that is known to have a certain mean $E_p[X] = \mu$ and variance $E_p[(X-\mu)^2] = \sigma^2$.
If we want to select a distribution that models this data in the absence of any other information, the maximum entropy principle suggests we should define the set $P$ as all distributions with mean $\mu$ and variance $\sigma^2$, and then choose the maximum entropy distribution $p$ from this set $P$.

As we'll discuss [later](06-machine_learning), this particular distribution $p$ turns out to be the Gaussian with mean $\mu$ and variance $\sigma^2$. So, the maximum entropy principle tells us that, without additional evidence, we should model such data as Gaussian, assuming the given mean and variance.

It's often helpful to think about this principle more abstractly. Imagine we don't even know the precise values of $\mu$ and $\sigma^2$; we just believe that the mean and variance are important parameters. In this scenario, the maximum entropy principle informs us that we should model the data using *some* Gaussian distribution. In other words, we conclude that the family of Gaussians is the *appropriate* family to represent numerical data when our primary concerns are their mean and variance. This is a very powerful insight!

![potato](04-minimizing/potato_maxent.png)


{/*
So, we can think of the philosophy of updating via Bayes' theorem as a special case of the philosophy of minimizing KL divergence. This is all very circular and a bit fuzzy, but the key takeaway is that minimizing KL can be thought of as extension of Bayes' philosophy.

### A few more observations <a id="a-few-observations"></a>

We will spend the whole next chapter discussing all the applications of the maximum entropy principle, but let's already make two observations about it. Those observations correspond to two important properties of entropy.

1. For discrete distributions over $\{1, \dots, k\}$, the distribution that maximizes the entropy is the uniform distribution<Footnote>See e.g. [this](https://stats.stackexchange.com/questions/66108/why-is-entropy-maximised-when-the-probability-distribution-is-uniform)</Footnote>. Its entropy is $\log_2 k$. The implication of this for the max-entropy principle is that if our set $P$ of allowed distributions contains the uniform distribution, then max-entropy principle chooses it. That is, maximum entropy principle is just an extension of the principle of indifference.

2. If you have a joint distribution $(p,q)$, then $H((p,q)) \le H(p) + H(q)$, with equality if and only if $p$ and $q$ are independent.
<Footnote>
This is called [subadditivity of entropy](01-kl_intro#information-theory). Why is it subadditive? If you still remember [our discussion of mutual information](01-kl_intro#information-theory), the mutual information is defined as $D((p,q), p \otimes q)$. You can rewrite this expression as $H(p) + H(q) - H((p,q))$ (try it!), so subadditivity of entropy is equivalent to mutual information being nonnegative.
</Footnote>
The implication for the max-entropy principle is this: Imagine that you work with a joint distribution and you know its two marginals $p,q$. Then, the maximum entropy principle tells us that the joint distribution with these two marginals that maximizes the entropy is the one where they are independent.
Whenever people model stuff by probability distributions, they assume that two distributions are independent all the time. We can think of this assumption as a special case of the maximum entropy principle.
*/}
</Expand>

## 🚀 What's next? <a id="next-steps"></a>

In the [next chapter](04-max_entropy), we'll explore more concrete modeling applications of the max entropy principle. We'll see how they apply to various fields like machine learning, statistical modeling, and elsewhere. 


=================================================================================
=================================================================================
CHAPTER: Maximizing entropy
FILE: 05-max_entropy.mdx
=================================================================================
=================================================================================

# Max entropy distributions <a id="max-entropy-distributions"></a>

In the [previous chapter](03-minimizing), we saw how minimizing KL divergence generalizes two vital statistical concepts: **maximum likelihood** and **maximum entropy**.

Let's now dive a bit deeper into maximum entropy. Specifically, we'll try to understand what maximum entropy distributions actually look like. For such a broad question, the answer turns out to be surprisingly straightforward!

<KeyTakeaway>
Max-entropy principle constructs the most generic distributions satifying some constraints. 
</KeyTakeaway>

## 🗺 General form of maximum entropy distributions

So, how do max-entropy distributions look like? 

Let's start with a couple of examples. If we consider distributions with a fixed expectation $E[X] = \mu$ (and the domain is non-negative real numbers), the maximum entropy distribution is the *exponential distribution*. This distribution has the form <Math math = "p(x) \propto e^{-\lambda x}" />. Here, $\lambda$ is a - fixing $E[X]$ to attain different values leads to different $\lambda$s. <Footnote>The symbol $\propto$ means that the if you use the formula, the probabilities don't sum up to one / probability densities don't integrate to one. You would have to multiply all $p(x)$ by a certain normalization constant for this to happen. Notice that using $\propto$ is a lot like using odds instead of probabilities - we don't want to focus on the relatively uninteresting normalization factors to avoid clutter. In this particular case, the precise shape of the distribution is <Math math = "p(x) = \frac{1}{\mu} e^{- x/\mu}" /> if you want $E_p[X] = \mu$. </Footnote>

Another example: If we fix the values of both $E[X]$ and $E[X^2]$, the maximum entropy distribution is the *normal distribution*, where <Math math = "p(x) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-(x-\mu)^2/(2\sigma^2)}." /> To keep things clean, we can rewrite its shape as <Math math = "p(x) \propto e^{-\lambda_1 x - \lambda_2 x^2}" /> for some constants $\lambda_1, \lambda_2$.

Spot a pattern?

<Block headline= "General form of max entropy distributions">
Suppose we have a set of constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$. Then, among all distributions that satisfy these constraints, the distribution $p$ with maximum entropy has the following shape:
<Math id="max-entropy-form" displayMode = {true} math = "p(x) \propto e^{\lambda_1 f_1(X) + \dots + \lambda_m f_m(X)}"/>
for some constants $\lambda_1, \dots, \lambda_m$.
</Block>
Notice that this general recipe doesn't tell us the exact values of $\lambda_1, \dots, \lambda_m$. Those depend on the specific values of $\alpha_1, \dots, \alpha_m$, while the general shape remains the same regardless of the $\alpha$ values. But don't get too hung up on the $\alpha$s and $\lambda$s. The key takeaway is that the maximum entropy distribution looks like an exponential, with the "stuff we care about"—the functions $f_1, \dots, f_m$—in the exponent.

Try building your own maximum entropy distribution on the interval $[0,1]$ by setting constraints:

<DistributionConstraintBuilder />

### 🧐 Why? <a id = "intuition"></a>

Let's build some intuition for this. Remember from [the previous chapter](03-minimizing) that the max-entropy principle is essentially about finding a distribution that is as close to uniform as possible, in the sense of minimizing KL divergence.

So, in what way are max-entropy distributions "close" to being uniform? Let's use the exponential distribution $p(x) \propto e^{-x}$ as an example. Say I independently sample two numbers from it, $x_1$ and $x_2$. Here's a little riddle: Is it more probable that I sample $x_1 = 10, x_2 = 20$ or that I sample $x_1' = 15, x_2' = 15$?

The answer is that both options have the same probability density. That's because $p(x_1)\cdot p(x_2) = e^{-x_1 - x_2}$. In our riddle, $x_1 + x_2 = x_1' + x_2'$, so both possibilities have a density proportional to $e^{-30}$. 

You can test it in the following widget. 

<MaxEntropyVisualization />

This isn't exclusive to the exponential distribution; it holds for all max-entropy distributions that fit the form given by our formula <EqRef id="max-entropy-form" />. If you dare, the widget above also visualizes that if you sample $x_1, x_2, x_3$ from a Gaussian and fix the values of $x_1 + x_2 + x_3$ and $x_1^2 + x_2^2 + x_3^2$, the curve this defines (a circle) has constant density. 

In general, consider a distribution of the shape <Math math = "p(x) \propto e^{\lambda_1 f_1(x) + \dots + \lambda_m f_m(x)}" />. Now, imagine independently sampling a few points $x_1, \dots, x_k$ from that distribution. If you then tell me the values of the averages $a_1 = \frac{1}{k} \sum_{i = 1}^k f_1(x_i), \dots, a_m = \frac{1}{k} \sum_{i = 1}^k f_m(x_i)$, and I condition on this information, the conditional distribution over $x_1, \dots, x_k$ is actually **uniform**! This is because the probability density of any such tuple under our distribution $p$ is the same, equal to 
<Math displayMode={true} math = "p(x_1, \dots, x_k) \propto e^{\lambda_1 f_1(x_1) \,+\, \ldots \,+\, \lambda_m f_m(x_1)} \cdot \dots \cdot e^{\lambda_1 f_1(x_k) + \dots + \lambda_m f_m(x_k)} = e^{k(\lambda_1 a_1 + \dots + \lambda_m a_m)}. " /> 

You can imagine this as a generalization of the widget above. There's a super complicated space of all possible outcomes I can get by sampling $N$ times from my distribution. The max-entropy property says that if I draw a "contour" through outcomes that share the same empirical averages of the functions $f_1, \dots, f_m$, the conditional distribution is uniform on this contour. 

So, what's the takeaway? When you sample from max-entropy distributions, the experience is actually quite similar to sampling from a uniform distribution! <Footnote>If we think of the number $n$ of samples as being very large, it gets even better. Due to the law of large numbers, we then know that with high probability, the empirical averages $\frac{1}{n} \sum_{i = 1}^n f_j(x_i)$ are going to be close to $E[f_j(X)]$. So, sampling many samples from max-entropy distributions is like sampling from the uniform distribution over all the instances that satisfy $\frac{1}{n} \sum_{i = 1}^n f_j(x_i) \approx E[f_j(X)]$. </Footnote>


<Expand headline = "Proper derivation by Lagrange Multipliers" advanced = {true}>
There's an elegant derivation of the shape of max-entropy distributions using Lagrange multipliers. Feel free to skip this if you're not familiar with how they work. We'll only consider discrete distributions, say those with support $\{1, \dots, K\}$. 

We are solving the following optimization problem for $K$ variables $p_1, \dots, p_K$:

<Math displayMode={true} math = "\begin{aligned}
\text{VARIABLES:} &\quad p_1, \dots, p_K \\
\text{MAXIMIZE:} &\quad \sum_{i = 1}^K p_i \log \frac{1}{p_i}\\
\text{CONSTRAINTS:} & \quad \sum_{i = 1}^K p_i \cdot f_1(i) = \alpha_1\\
&\quad \vdots \\
&\quad \sum_{i = 1}^K p_i \cdot f_m(i) = \alpha_m\\
&\quad \sum_{i = 1}^K p_i = 1
\end{aligned}"/>

If there were no constraints, the problem would be simple! We'd just take the expression to maximize (the entropy) and set all partial derivatives with respect to $p_1, \dots, p_K$ to zero.

Fortunately, a technique called [Lagrange multipliers](https://en.wikipedia.org/wiki/Lagrange_multiplier) helps us here. It involves turning _hard_ constraints (like those in our problem) into _soft_ constraints. A soft-constraint version of our problem would be:

<Math displayMode={true} math = "\begin{aligned}
\text{VARIABLES:} &\quad p_1, \dots, p_K\\
\text{MAXIMIZE:} &\quad \sum_{i = 1}^K p_i \log \frac{1}{p_i}\\
&\quad - \lambda_1 \left(\sum_{i = 1}^K p_i \cdot f_1(i) - \alpha_1\right)\\
&\quad - \lambda_2 \left(\sum_{i = 1}^K p_i \cdot f_2(i) - \alpha_2\right)\\
&\quad - \dots \\
&\quad - \lambda_m \left(\sum_{i = 1}^K p_i \cdot f_m(i) - \alpha_m\right)\\
&\quad - \lambda_{m+1} \left(\sum_{i = 1}^K p_i - 1\right)
\end{aligned}"/>

What happens is that instead of requiring the solution to *exactly* satisfy all the constraints, we just say that we have to pay an additional cost for deviating from the target. The constants $\lambda_1, \dots, \lambda_{m+1}$ essentially tell us how important each constraint is—a large $\lambda_j > 0$ means that $\sum_{i = 1}^K p_i \cdot f_j(i) - \alpha_j$ had better be small! <Footnote>In fact, in this soft constraint formulation, we even get "paid" if <Math math = "\lambda_j \left( \sum_{i = 1}^K p_i \cdot f_j(i) - \alpha_j \right) < 0" />! </Footnote>

Long story short, Lagrange's method tells us that if someone provides a solution to our problem satisfying all $m+1$ _hard_ constraints, then we can find $m+1$ numbers $\lambda_1, \dots, \lambda_{m+1}$ such that this solution also solves the soft-constrained version. That's neat! We can now implement our plan of solving this by differentiation.

More precisely, let's use $\mathcal{L}$ for the soft-constrained objective:
$$
\mathcal{L}(p_1, \dots, p_K) = \sum_{i = 1}^K p_i \log \frac{1}{p_i}
- \lambda_1 \left(\sum_{i = 1}^K p_i \cdot f_1(i) - \alpha_1\right)
- \dots -
- \lambda_m \left(\sum_{i = 1}^K p_i \cdot f_m(i) - \alpha_m\right)
- \lambda_{m+1} \left(\sum_{i = 1}^K p_i - 1\right)
$$

We compute the derivative with respect to some $p_i$. Using the fact that $(p \log 1/p)' = -(p\log p)' = -\log p - 1$, we find that:

<Math displayMode={true} math = "\frac{\partial \mathcal L}{\partial p_i} = -\log p_i - 1 - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i) - \lambda_{m+1}"/>

That's fantastic! If we now set <Math math = "\frac{\partial \mathcal L}{\partial p_i} = 0"/>, we get a formula for $p_i$:
<Math displayMode={true} math = "p_i = e^{ -1 - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i) - \lambda_{m+1}}"/>
I find it more helpful to rewrite this as:
<Math displayMode={true} math = "p_i \propto e^{ - \lambda_1 f_1(i) - \dots - \lambda_m f_m(i)}"/>

I've just swept some proportionality constants under the rug: if we remember that probabilities have to sum up to 1, we've arrived at a shockingly simple formula!

We could, of course, generalize this formula to other discrete sets beyond $\{1, \dots, K\}$, yielding:

<Math displayMode={true} math = "p(x) \propto e^{ - \lambda_1 f_1(x) - \dots - \lambda_m f_m(x)}"/>

This is the general form of max-entropy distributions (except we formulated it with $+\lambda_j$ instead of $-\lambda_j$). 

The same formula also holds when the probability distribution is continuous, except that $p(x)$ is then technically a probability density. Also, the correct buzzword is no longer Lagrange multipliers, but its generalization called [calculus of variations](https://en.wikipedia.org/wiki/Calculus_of_variations). <Footnote>You also have to spend a few more years trying to understand the conditions under which it can be used. Even the Lagrange multiplier case is more tricky—for example, we've only found local extrema and saddle points, not necessarily the maximizer. In our case, we are fortunate that we minimize convex function over convex domain, where the local minimum is also the global minimum. </Footnote>

Now, this formula isn't the complete solution to our problem because it involves some magical constants $\lambda_1, \dots, \lambda_m$ that we don't know. To find their values, we have to go back to our constraints—remember those $m$ numbers $\alpha_1, \dots, \alpha_m$? We can use the conditions $E[f_j(x)] = \alpha_j$ to work out the precise shape of the distribution.
</Expand>



---

## 📚 Catalogue of examples

Let's go through the list of maximum-entropy distributions you might have encountered. In fact, most distributions used in practice are maximum entropy distributions for some specific choice of functions $f_1, \dots f_m$.

So, when you come across a distribution, the right question isn't really "Is this a max entropy distribution?" It's more like, "**For what parameters is this a max entropy distribution?**" For example, you can forget the exact formula for the Gaussian distribution—it's enough to remember that using it implies you believe the mean and variance are the most important parameters to consider.

Let's go through the examples with this in mind. 

### 🌅 No Constraints

In the absence of any constraints, we have $p(x) \propto e^{0}$, which means the max entropy distribution is *uniform*. In other words, the maximum entropy principle is truly an extension of [the principle of indifference](03-minimizing#maximum-entropy-principle) that we discussed in the previous chapter.

One painful fact to keep in mind is that the uniform distribution doesn't always exist. Concretely, there's no uniform distribution over all real numbers.

### 🎲 Fixing $E[X]$ (Logits)

If we believe the mean is an important parameter of a distribution (as we usually do), the max entropy principle states that the right family of distributions to work with are those with the shape:

<Math displayMode={true} math = "p(x) \propto e^{\lambda x}"/>

This kind of distribution is known by several names, depending on its domain. Let's first understand the simplest possible case: when our distribution is supported on only two outcomes, $a_1, a_2$. Then, the max-entropy distribution takes the form:

<Math displayMode={true} math = "p(a_1) = \frac{e^{ \lambda a_1}}{e^{ \lambda a_1} + e^{ \lambda a_2}},\;\;\; p(a_2) = \frac{e^{\lambda a_2}}{e^{\lambda a_1} + e^{ \lambda a_2}}"/>

But it's actually better to write it like this:

<Math displayMode={true} math = "p(a_1) = \frac{1}{1 + e^{- \lambda (a_1 - a_2)}},\;\;\; p(a_2) = 1 - p(a_1)"/>

The function $\sigma(x) = 1/(1 + e^{-x})$ is called the [logistic function](https://en.wikipedia.org/wiki/Logistic_function)<Footnote>Or sometimes a sigmoid function. Apparently, [sigmoid function](https://en.wikipedia.org/wiki/Sigmoid_function) is a bit more general term.</Footnote> and the parameter $x$ is typically called a [logit](https://en.wikipedia.org/wiki/Logit). Using this function, our max-entropy distribution can be written as:

<Math displayMode={true} math = "p(a_1) = \sigma(\lambda (a_1 - a_2)),\;\;\; p(a_2) = 1 - \sigma(\lambda (a_1 - a_2))"/>

Here's my interpretation: if you want to talk about probabilities, but for some reason you prefer to work with general real numbers instead of numbers in $[0,1]$, you should use logits and apply the logistic transformation to convert them to probabilities. 

The parameter $\lambda$ in the formula corresponds to the choice of units in which we measure those logits. For instance, I often prefer to use the binary logarithm, which means measuring logits in bits.

<LogisticWidget 
  title="Sigmoid Function" 
  initialLambda={2}
  minLambda={-5}
  maxLambda={5}
/>

<Expand headline = "Elo System">
The Elo system is used to assign ratings to players. Its fundamental idea is that when you have two players with Elos $E_1$ and $E_2$, you can estimate the probability that the first one wins from their difference $D = E_1 - E_2$. As we just discussed, the logistic function is the right way to convert the difference $E_1 - E_2$ to probability. 

Indeed, this is how Elo was designed: The interpretation of a chess Elo number is that the probability that the first player wins should be <Math math = "\frac{1}{1 + 10^{D / 400}}" />. <Footnote>It's more precisely the expected score of the first player due to the existence of draws.</Footnote> This is the logistic function with $\lambda = \frac{1}{400} \cdot \ln 10$.

Notice that without knowing the value of $\lambda$, the statement "the Elo difference between these two players is 200" is meaningless—we don't know how Elo is scaled. Yet, even without knowing $\lambda$, we understand the system pretty well: if the chance of an upset (i.e., the lower-rated player wins) is $p$ for $D = 200$, then for $D=400$ it's roughly $p^2$, for $D=600$ it's roughly $p^3$, and so on.
</Expand>

<Expand headline = "Probabilities vs. Logits">
When we analyzed the Bayesian hero from the [first chapter](01-kl_intro), it was easier to work with logarithms of odds rather than the odds themselves. Since in our example there were just two hypotheses, we subtracted the two relevant surprisals and worked with "log-odds." 

We could also say that we were working "in the logit space" or "with logits".  
</Expand>

<Expand headline="Logistic activation function">
In the early days of deep learning, the logistic function was used as an [activation function](https://en.wikipedia.org/wiki/Activation_function)—it converted aggregated inputs to a neuron's output. We can now provide a probabilistic rationale for this: this way of handling neurons corresponds to modeling them as devices where "each neuron aggregates its inputs and then decides _whether_ to fire or not."

Unfortunately, this function doesn't seem to perform too well in practice. As the field evolved, researchers realized it's better to use the [ReLU](https://en.wikipedia.org/wiki/Rectifier_(neural_networks)) activation function (or [something similar](https://en.wikipedia.org/wiki/Activation_function#Comparison_of_activation_functions)) instead of sigmoids. That activation function corresponds to neurons that not only contemplate *whether* to send any signal or none, but also send out a stronger output signal if they receive strong input.
</Expand>

### 🌡️ Fixing $E[X]$ (Softmax) <a id = "softmax"></a>

Let's stick with the max-entropy distribution for $E[X]$, but now consider the more general case where our distribution is supported on a set of numbers $\{a_1, \dots, a_k\}$—these distributions are often called [categorical distributions](https://en.wikipedia.org/wiki/Categorical_distribution). In this scenario, the max entropy distribution is what's known as a *softmax* (or _softmin_) distribution—each number $a_i$ is chosen with probability:

<Math displayMode={true} math = "p_i \propto e^{\lambda a_i}. "/>

You can think of the softmax function (or softmin if $\lambda < 0$) as the generalization of the logistic function we just discussed—it's **the right way** to convert a bunch of numbers into probabilities. The numbers $a_i$ are still referred to as logits.

The parameter $1/|\lambda|$ is frequently called "temperature" because it behaves that way: at low temperatures, softmax is very orderly and acts much like the `max` function, whereas for high temperatures, the distribution becomes more chaotic, ultimately approaching the uniform distribution. The chaos can be measured by entropy - you can see in the widget below how it decreases if you increase $|\lambda|$. 


<SoftmaxWidget values={[1, 3, 2, 5, 4]} title="Softmax Distribution Example" />


<Expand headline = "Logits in Neural Networks">
Typical neural networks output probabilities. For example, a common neural network classifying images will output an entire probability distribution indicating whether a given picture is a dog/cat/horse/... instead of just a single prediction.
The issue with this is that often, most of these probabilities are extremely small, perhaps on the order of $10^{-10}$. That's because, given a picture of a dog, the neural network is usually quite certain it's not an octopus.

This makes it awkward to work directly with probabilities inside the network—it leads to all sorts of numerical and stability issues while running it (float precision) and even more while training it (vanishing gradients). So, neural networks instead try to predict **logits**, and the conversion to probabilities is simply the final layer of the network.

A nice bonus is that if you train the network using softmax with $\lambda = 1$, you can change the $\lambda$ parameter *after* training. For instance, setting $\lambda$ to infinity (temperature goes to zero) is equivalent to simply choosing the most probable option—this makes the model's output deterministic, which is often useful during deployment.

{/*There are also application for higher temperatures. For example, if you want to use LLM to solve a hard math problem, you might want to run it a million times to increase the probability the net solving it. But then you should probably run it at higher temperatures to make sure you want get the same thought process a million times in a row.

Notice how softmax allowed us to elegantly solve a problem that's so fuzzy that it's otherwise pretty hard to approach -- given a probability distribution $p$, how do we find distributions $p'$ that preserve as much as possible from $p$, yet they are more or less concentrated on the most probable values. */}
</Expand>

{/*
<Expand headline = "Modeling Pasta Consumption">

![Types of pasta -- from https://suttachaibar.com/15-types-of-pasta-shapes-to-know-and-love/](04-max_entropy/pasta.webp)

Theoretical economics tries to understand setups like this: Imagine there are $k$ substitutable products competing in the market—perhaps different shapes of pasta. We can observe how well each shape sells, but to draw conclusions from this data, we need some underlying model of what's happening. The basic model of rational consumers assumes each product $i$ has a certain utility $a_i$, and each customer simply buys the product with the highest utility. The problem with this model is that it predicts people should consistently buy only a single product—the one with the largest $a_i$.

How should we adapt this model to allow for non-trivial probability distributions? Well, we've seen that the natural "soft" generalization of taking a maximum is the softmax function, and this is indeed the function economists use to model such situations. There are more possible justifications for using this more complicated model—each customer might have a slightly different utility function, dislike repetition in their diet, etc. The parameter $\lambda$ in this model (the inverse temperature) then measures the strength of all these factors.

However, it's worth noting that one popular interpretation of softmax in behavioral economics is more sophisticated than "softmax seems natural, so let's go with it, whatever." The approach of the **theory of rational inattention** suggests that even if all agents are perfectly rational and have the same utilities, they still need to spend a non-trivial amount of time comparing different options and estimating their utility (at this point, stop thinking about pasta and instead consider buying a flat or a car). If you think about customers as solving an optimization problem that accounts for this, you end up with a type of optimization problem similar to [our derivation of max-entropy distributions](#intuition); under reasonable<Footnote>I.e., I forgot them.</Footnote> circumstances, you can derive the softmax distribution as the distribution of observed purchases.

</Expand>
*/}

### 📉 Fixing $E[X]$ (Exponential/Geometric Distribution) <a id = "exponential"></a>

If the domain of the probability distribution is non-negative integers or reals, then we get the so-called [geometric](https://en.wikipedia.org/wiki/Geometric_distribution) / [exponential](https://en.wikipedia.org/wiki/Exponential_distribution) distribution—another very basic and useful distribution. You should think of this as **the most natural** distribution on the domain of positive numbers (whether integers or reals).

In the [previous chapter](03-minimizing), we discussed the example of modeling how long I take for lunch. The expected length is a natural parameter, so modeling it with the exponential distribution is a natural choice.

{/*
<Footnote>
In practice, my guess would probably not have tail $p(x) \propto e^{-x}$, but a heavier tail, like <Math displayMode={false} math = "p(x) \propto e^{-\sqrt{x}}"/> or even $p(x) \propto 1/x^{C}$. Why? Well, notice how I am not sure about what the actual mean is. So, I should perhaps use a 2-layered model: 1) I sample your average lunch time $\mu$ from some distribution 2) I use exponential distribution with mean $\mu$.

How should I sample $\mu$ in the first step? Applying max-entropy principle again, perhaps I should sample it from exponential distribution, with mean being how long it takes me / average person to eat their lunch. If you crunch the numbers, the overall distribution that I will use as my input is going to have tails <Math displayMode={false} math = "p(x) \propto e^{-C\sqrt{x}}"/>. That is, the model is getting less sure that I won't see some really large numbers. Using power-law distribution in step 1) would lead to $p(x) \propto 1/x^{C}$.

This discussion is mostly meant to show what I love on the max entropy principle -- it enables us to rapidly operationalize and concretize our thought processes. Modelling real life is hard, but now we have a powerful tool that automatically builds concrete probabilistic models from vague thoughts like "there's two types of randomness, first in the average lunch time, and second in the variation around that average".
</Footnote>*/}

There's still an elephant in the room, though—the exponential distribution can't be normalized if the domain are _unbounded_ real numbers (i.e., both positive and negative).

### 🔔 Fixing both $E[X]$ & $E[X^2]$ (Normal Distribution) <a id = "normal"></a>

If we believe that both the mean and the variance are interesting, the max entropy principle suggests that we should choose the function that has a quadratic function of $x$ in the exponent. This means it has the shape:
<Math displayMode={true} id = "gaussian" math = "p(x) \propto e^{-\lambda_1 x^2 - \lambda_2 x}"/>

{/*This gets more familiar if we rewrite the equation like this:
<Math displayMode={true} math = "p(x) = A e^{-B(x-C)^2}"/>
where $A,B,C$ are some constants chosen so that $p(x)$ integrates to $1$.*/}
This is the family of [normal (or Gaussian) distributions](https://en.wikipedia.org/wiki/Normal_distribution), and the density formula is usually written more precisely as <Math math = "p(x) = \frac{1}{2\pi\sigma^2} e^{-(x-\mu)^2/\sigma^2}" /> <Footnote>Notice that for a bounded domain, the probability function from <EqRef id = "gaussian" /> could also look like $p(x) \propto e^{x^2}$. That is, the distribution with the smallest probabilities in the middle and large probabilities at the edges is also a perfectly fine max-entropy distribution. However, a distribution with this shape is not normalizable to 1 if the domain is all real numbers. There, the only possible solution is the familiar bell-shaped curve. </Footnote>

I think this provides a good (partial) explanation for "why is there $x^2$ in Gaussian?" It simply means that the Gaussian is the **right** distribution to work with if you care about the mean and the variance. If you cared about the first four [moments](https://en.wikipedia.org/wiki/Moment_(mathematics)), the appropriate family of distributions would be those with four-degree polynomials in the exponent.

Often, I like to think about the Gaussian as the simplest possible distribution on real numbers. Neither the uniform distribution nor the exponential distribution can be normalized over the entire real line, so we salvage this by fixing the first two moments.

<Expand advanced={true} headline = "Maximum Entropy & Central Limit Theorem">

The normal distribution has two important properties. First, it's the maximum entropy distribution for a given mean and variance. Second, it's the distribution from the [central limit theorem](https://en.wikipedia.org/wiki/Central_limit_theorem). Roughly speaking: If you keep adding some random variables $X_1, \dots, X_N$, each with mean $\mu$ and variance $\sigma^2$, then the value of <Math math = "\frac{X_1 + \dots + X_N - N\mu}{\sqrt{N\sigma^2}}"/> will be distributed like $N(0,1)$.

Here's how the max entropy principle can help you think about this theorem: For the theorem, the mean and variance are clearly important parameters. Thus, the max entropy principle suggests that if there's a single distribution to which sums are converging, the Gaussian is a natural candidate.

The connection between the two is deeper. In fact, [one of the proofs](https://en.wikipedia.org/wiki/Entropy_power_inequality) of the central limit theorem works roughly like this: The operation of adding random variables - [convolution](https://en.wikipedia.org/wiki/Convolution) - has ["smearing-out" properties](https://en.wikipedia.org/wiki/Kernel_(image_processing)) that increase the entropy of the sum (there are [inequalities](https://en.wikipedia.org/wiki/Entropy_power_inequality) that can measure this increase). After a bit of math, this implies that the distribution of the sum of random variables with normalized variance must look closer and closer to the distribution of the appropriate maximum entropy distribution, i.e., the Gaussian.
</Expand>

<Expand headline = "Application: Measuring Feet">
One of the running examples we used was [measuring of feet](00-introduction#statistics). Why should we model the data using the normal distribution? One way to reason about this is that the length of a foot is a random variable that can probably be modeled as a sum of many small and relatively independent random variables. Thus, using the central limit theorem, the normal distribution is a good fit.

We could also try to approach this modeling problem purely from the max-entropy perspective. Since the data is positive, the simplest model for it is the exponential distribution. But that seems to predict, for example, that we'll see many people with foot lengths twice the average, which doesn't seem to match reality.

The next better model takes into account that the typical deviation of the distribution from the mean is probably quite a bit smaller than the mean. The max entropy distribution if we now consider both the mean and the variance (which represents the scale) is going to be the normal distribution. <Footnote>More precisely, since the domain is _positive_ real numbers, the max entropy distribution is a Gaussian that is clipped to zero for negative numbers and rescaled to sum up to 1.</Footnote>
</Expand>

### 🔢 Other Examples

Here are a few more examples you might have encountered. 

<Expand headline ="Assuming Independence">
An important property of entropy is that if you have a joint distribution $(p,q)$, then $H((p,q)) \le H(p) + H(q)$, with equality if and only if $p$ and $q$ are independent. <Footnote>This is called [subadditivity of entropy](https://math.stackexchange.com/questions/3326158/proof-of-sub-additivity-for-shannon-entropy). Why is it subadditive? If you still remember [our discussion of mutual information](01-kl_intro#information-theory), mutual information is defined as $D((p,q), p \otimes q)$. You can rewrite this expression as $H(p) + H(q) - H((p,q))$ (try it!), so subadditivity of entropy is equivalent to mutual information being non-negative.</Footnote>

The implication for the max-entropy principle is this: Imagine you're working with a joint distribution and you know its two marginals $p,q$. Then, the maximum entropy principle tells us that the joint distribution with these two marginals that maximizes entropy is the one where they are independent.

Whenever people model things using probability distributions, they often assume that certain distributions are independent if they don't know what the dependence between them looks like (i.e., they make this assumption all the time). We can think of this as a special case of using the maximum entropy principle.

![independence](04-max_entropy/independence.png)

</Expand>
<Expand headline ="Power Law Distributions">
Sometimes we care about random variables that span a large range of values. For example, the median US city has a population of about 2,400, but there are many cities with more than a million inhabitants (see the picture).

![US cities](04-max_entropy/cities.png)

These situations are typically modeled by *power-law distributions*, where $p(x) \propto 1/x^C$ for some constant $C$. In the picture above, such a distribution would correspond to a straight line, so it would fit city populations quite well. From the perspective of maximum entropy, these distributions are simply max-entropy distributions when we fix $E[\log X]$.

That is, whenever you use a power-law distribution, you're implicitly saying, "__The important thing to look at is not $X$, but $\log X$.__" In the case of cities, for example, it feels more sensible to classify them on a log-scale ($10^4$ – small, $10^5$ – medium, $10^6$ – large, $10^7$ – megacity) instead of a normal scale ($10^5$ – small, $2 \cdot 10^5$ – medium, ...). A power-law distribution is then just the exponential into which we plug in $\log X$ instead of $X$.

</Expand>
<Expand advanced={true} headline ="Beta Distribution">
Our coin-flipping riddle from the [intro](01-kl_intro) was a bit silly - we somehow assumed that our coin was either fair, or 40/60 biased, but nothing else was possible. In reality, any bias $p$ is plausible, so Bayesian statistician would work with a distribution over $[0,1]$ and update the whole distribution after each flip. 

What distribution over $[0,1]$ should we choose? If we start with the uniform distribution (max-entropy without any constraints), then the family of the distributions that the Bayesian can see after a few flips is called the [Beta distributions](https://en.wikipedia.org/wiki/Beta_distribution). 

Here's another reason for why this family is natural: We could argue that given some $X \in [0,1]$ the more relevant quantity to work with is the logit - $\log X / \log (1-X)$. So, shouldn't the _right_ distribution to work with be the max-entropy distribution for $f(X) = \log X / \log (1-X)$? Unfortunately, max-entropy distribution for this does not exist (it blows up on one end of $[0,1]$), but the max-entropy family for $f_1(X) = \log X$ and $f_2(X) = \log (1-X)$ normalize in the relevant scenarios and it's exactly the family of beta distributions. 
</Expand>
<Expand advanced={true} headline ="Exponential Family">

In the case of discrete distributions over, say, $\{1, \dots, K\}$, literally any distribution is a maximum entropy distribution for certain $K$ constraints. For example, for your favorite distribution $p = (p_1, \dots, p_K)$, choose the $j$-th constraint to be $E[\mathbb{1}_j(i)] = p_j$ where $\mathbb{1}_j$ returns 1 for $i=j$ and 0 otherwise; the max entropy distribution for these $K$ constraints is exactly $p$.

However, for distributions over real numbers and finitely many reasonable functions $f_1, \dots, f_m$, only a small proportion of distributions are max-entropy for some family of functions.

The **exponential family** is the elite group of distributions that are maximum entropy distributions for some functions $f_1, \dots, f_m$. <Footnote> More precisely, it's the family of distributions that are "min KL distributions" for some $q$: A distribution from that family minimizes $D(p,q)$ from some not necessarily uniform distribution $q$, given some constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$. As an example, take the domain $\{0, 1, \dots, n\}$ and consider the constraint $f(X) = X$. We have already seen that this leads to the exponential distribution, given we start with uniform $q$. Now, consider $q$ with <Math math = "q_i = {n \choose i} / 2^n"/> instead. The new solution is the distribution $p$ with <Math math = "p_i \propto {n \choose i} \cdot e^{\lambda i}"/>. After we substitute $\lambda = \log p/(1-p)$, we get the formula for the binomial distribution. Thus, binomial distribution belongs to the exponential family using $f(X) = X$, even though it's not a max-entropy distribution for that $f$.</Footnote>
So, any distribution with a finite domain is in the exponential family. Any distribution we've discussed so far (exponential, geometric, normal, power-law, beta) is in the exponential family. [Wikipedia](https://en.wikipedia.org/wiki/Exponential_family) contains a long list of distributions in that family, many of which I've never heard of.

The importance of this family is that its distributions have a bunch of nice and intuitive properties.
<Expand advanced={true} headline="A theoretically nice property of exponential-family distributions">
Here's one of the nice properties that's relevant for the next chapter but perhaps too obscure to fully appreciate on a first read.

Suppose you have some data with mean $\mu$ and variance $\sigma^2$ and you want to fit it with a distribution. There are two ways to approach this:

1.  Use the maximum entropy principle to deduce that you should model it with a normal distribution. Then use maximum likelihood to find the best parameters <Math math = "\hat{\mu}, \hat{\sigma^2}" /> for this general model—it turns out that <Math math = "\hat\mu_{MLE} = \mu, \hat\sigma^2_{MLE} = \sigma^2"/>.

2.  Use the maximum entropy principle directly—the max entropy distribution with mean $\mu$ and variance $\sigma^2$ is $N(\mu, \sigma^2)$.

Both approaches yield the same answer, but it's not clear a priori that this should be the case! Perhaps MLE could have determined that $N(\mu, \frac{n-1}{n} \sigma^2)$ is a better fit for the data.

Fortunately, distributions in the exponential family have the nice property that both approaches give the same answer. That is, if you determine the parameters of the distribution using MLE, they turn out to be what they "should" be. Formally, if your distribution is defined by constraints $E[f_1(X)] = \alpha_1, \dots, E[f_m(X)] = \alpha_m$, then <Math math = "\hat\alpha_{1, MLE} = \alpha_1, \dots, \hat\alpha_{m,MLE} = \alpha_m" />.
</Expand>

</Expand>
<Expand advanced={true} headline ="Boltzmann Distribution">

Imagine many particles in a box, each particle $i$ having some energy $E_i$. What's the distribution of these energies? The maximum entropy principle suggests that the energies will be distributed according to the formula <Math math = "p_i \propto e^{-\lambda E_i}" />.

This is indeed a good guess. Here's (roughly) why. When you have many particles in a box, every now and then two particles fly close to each other and exchange energies. Basically, the particles first have energies $E_1, E_2$, then some interesting physics happens, and then they have energies $E_1', E_2'$. What's important is that $E_1 + E_2 = E_1' + E_2'$; that's the conservation of energy.

So, the conditional distribution of energies of two random particles with total energy $E$ should, intuitively, be uniform. But remember [our intuition](04-max_entropy/intuition) about max-entropy distributions: this is exactly the property of a max-entropy distribution.
</Expand>

<Expand advanced={true} headline ="Solomonoff Prior">

Given an algorithm, the most basic measure of its complexity is its length. Given a mathematical object $x$, the most basic measure of its complexity is the length of the shortest algorithm that describes that object. This is called **Kolmogorov complexity** $K(x)$.

For example, even though $\pi$ has infinitely many digits, its Kolmogorov complexity is small because there's [a short algorithm](https://www.quora.com/Whats-an-easy-algorithm-to-generate-digits-of-%CF%80) that keeps printing its digits.

In some abstract theories (like [Solomonoff induction](https://en.wikipedia.org/wiki/Solomonoff%27s_theory_of_inductive_inference) or [Tegmark's multiverse](https://en.wikipedia.org/wiki/Multiverse)), we want a distribution over all mathematical objects (whatever that means). We then choose the max-entropy distribution, i.e., <Math math = "p(x) \propto e^{-\lambda K(x)}" />. This is called the **Solomonoff prior**.
</Expand>

---

## 🚀 Applications

Let's look at some applications of this to our riddles.

<Expand headline ="🤓 Understanding XKCD jokes">

After four chapters developing the theory of KL divergence, we're finally ready to [dissect](https://www.goodreads.com/quotes/440683-explaining-a-joke-is-like-dissecting-a-frog-you-understand) the XKCD joke from [the list of riddles](00-introduction#xkcd).

![Are the odds in our favor?](00-introduction/countdown.png)

It's all about how to choose a prior for the number on the wall. The first natural choice is simply the uniform one; that is, before looking at the wall, we think the number is a uniform random number with 14 decimal digits. After observing the right 8 digits, the first 6 are still uniformly random <Footnote>We actually also see a small piece of the leftmost digit in the comic, but let's forget this for simplicity.</Footnote>. So, for that prior, the probability that all 6 digits are zero is $1/10^6$—we are probably fine.

Uniform prior over $[0, 10^{14}]$ kind of sucks, though. Why should the prior probability stay constant and then suddenly drop to zero? Isn't the fact that the countdown is in seconds an evidence that the number may be small? Also, if you look at various catastrophes, the average time until the next one is all over the place -- $\sim 10^{15}$ seconds for $10km$-sized asteroids, $\sim 10^{10}$ for 9+ Richter-scale supervolcano eruption, and up to $\sim 10^{8}$ for AI doom. <Footnote>See [Precipice](https://books.ms/main/0F4823107289367C7A16C0AB1CF0F71D) by Toby Ord for estimations of these numbers. </Footnote>

Given all this, I'd argue for choosing the distribution $p(x) \propto 1/x$ which corresponds to a uniform distribution over the _scales_. <Footnote>By this, I mean that this distribution satisfies <Math math = "\int_{10^1}^{10^2} \frac{1}{x} dx = \int_{10^2}^{10^3} \frac{1}{x} dx = \int_{10^3}^{10^4} \frac{1}{x} dx = \dots " />.  </Footnote> This is also called the [log-uniform distribution](https://en.wikipedia.org/wiki/Reciprocal_distribution). This is a pretty useful distribution with some very nice usecases like [the Benford's law](https://en.wikipedia.org/wiki/Benford%27s_law). 

Both uniform and log-uniform distributions are special cases of power-law (<Math math = "\textrm{uniform = }e^{0\cdot \log X}, \textrm{log-uniform = }e^{1\cdot \ln X}" />). The usual problem with $p(x) \propto 1/x$ is that we can't normalize this distribution if the domain is all real numbers, similarly to why we can't normalize the uniform distribution there. In our case, we can restrict the domain to integers between $0$ and $10^{14}$, so it's fine.

See the posterior probability for $X = 2382$ in the widget below. 

<XKCDCountdownWidget />

{/*
<Expand advance = {true} headline = "More plots for log-uniform prior">
The plot below shows the whole posterior distribution if we start with the log-uniform prior (on the left) and condition on the last digits of $x$ being "00002382". We grouped $x$-values into bins between $10^1, 10^{1.5}, 10^2, \dots$

![xkcd posterior](04-max_entropy/xkcd.png)

As in the widget, almost all the probability is now concentrated on a single outcome—$x_0 = 2382$. That makes sense: in the prior, it had probability $p(x_0) \propto 1/x_0 \approx 5 \cdot 10^{-4}$, while the next most likely outcome—$x_1 = 100002382$ had probability $p(x_1) \propto 1/x_1 \approx 10^{-8}$. That is, the probability of $x_1$ was $10^{-4}$ times smaller in the prior.

But also notice is that the posterior distribution still looks uniform for numbers $>10^9$. This also makes sense—for large numbers, their last few digits are like a coin flip, so learning them doesn't significantly change things, and thus the posterior remains uniform there.
</Expand>
*/}

The point is that the max-entropy principle gives us a language to talk about different priors and what they stand for. If a very natural log-uniform prior says we are not fine with probability $> 0.999$, maybe it's time to move the picture away. 
</Expand>

<Expand headline="📈 S&P shape"> <a id="application-understanding-financial-data"></a>

Let's revisit our financial mathematics riddle [from the intro](00-introduction/financial-mathematics). In that riddle, we look at daily changes in S&P index (normalized as a so-called log-return $\log S_{i+1}/S_{i}$ for all consecutive daily values $S_i, S_{i+1}$) and plot them in a histogram in the following widget

<FinancialDistributionWidget showBTC={true} showSAP={true} />

You can observe that the Laplace distribution seems to fit the data better than the normal distribution, as measured by KL between the data and the model distribution. 

### Laplace distribution

The Laplace distribution has the shape <Math math = "p(x) \propto e^{-\lambda |x-\mu|}" />. What's the meaning of this formula? We could think of it as the max entropy distribution for fixing the value $E[|X-\mu|]$, but there's a more illuminating way to understand it. The Laplace distribution with parameter $\lambda$ can be viewed as the result of the following process:<Footnote>Let me know if you know a simple proof of this fact!</Footnote>

1.  Sample a variance $\sigma^2$ from the exponential distribution. <Footnote>If we want Laplace distribution <Math math = "p(x) \propto e^{-\lambda |x-\mu|}" />, we should sample $\sigma^2$ from exponential distribution <Math math = "p'(t) \propto e^{-2/\lambda^2 \cdot t}"/>. </Footnote>
2.  Output a sample from $N(\mu, \sigma^2)$.

### S&P stories

To understand how this helps explain our financial data, consider the following two stories for price fluctuations:

* For the S&P index, which represents an average of many large companies, there's some variance in the daily change mostly because many (somewhat independent) trades happen that day, each making the value of the index slightly higher or lower. This is the setup for the central limit theorem, which predicts that the data will look approximately Gaussian.

* But now think about the index over a longer time period. Then the simplified model above might be too basic. There are definitely periods where not much happens, but also periods with large volatility. <Footnote> For example: US elections, financial crisis, pandemic hits, war starts, etc.</Footnote>

Perhaps we should try a more advanced two-layered model to predict the shape of our data: Maybe each month, we sample $\sigma^2$—the volatility for that month. Let's sample it from the max-entropy distribution, i.e., exponential. Next, for the rest of the month, we sample from a Gaussian with that variance. As we mentioned, this two-layered process actually samples from the Laplace distribution.

Put differently, while a Gaussian fit implies "I'm pretty sure about today's volatility and unsure about the fluctuation around the mean," Laplace is saying, "I'm uncertain both about the volatility and the actual fluctuation of the day." This explains why Gaussian fits near-term data (volatility of the time period stays roughly the same), while more long-term data starts looking more like Laplace. 

Our Laplace story suggests that the data should look more like Gaussian at the beginning and then look more and more like Laplace, which really seems to be happening. 

## 🤔 Is Laplace a good model?

Not really. We now understand that by fitting Laplace, we are claiming that daily variance fluctuates according to exponential distribution. Let's see how daily variance of S&P looks like:

<VolatilityDistributionWidget />

Exponential is not a great fit. As far as I know, practitioners use distributions such as log-normal, gamma, or inverse-gamma to fit this kind of data (or they train a network to fit it). These distributions are more complicated and correspond to more complicated stories about how the data behaves. Most importantly, they are basically power-law fits that are less surprised by stock crashes / world wars / etc. 

{/*<Footnote>As far as I know, one standard way of modeling financial data is the Student-t distribution. I won't bore you with its formula, but I'll tell you it's the distribution you get from a similar process to how we arrived at Laplace; but instead of sampling $\sigma^2$ from the exponential distribution, you sample it from the so-called inverse gamma distribution. The Gamma distribution is itself a max-entropy distribution for fixing $E[X]$ and $E[\log X]$ (and inverse gamma distribution means we measure volatility by $1/\sigma^2$ instead of $\sigma^2$).
That is, the Student-t distribution takes our model a bit further and adds uncertainty about the _scale_ of the volatility. For example, maybe if you look far enough into the past, you start seeing some extreme events like world wars/the Great Depression/industrial revolution, so perhaps we should be open to power-law fits instead of exponential ones.</Footnote>*/}

At this point, I should confess that I know nearly nothing about financial mathematics. This discussion is just based on me playing with Claude/GPT and trying some stuff. But this is exactly the point - max-entropy is so powerful because it gives you the right language to talk about data fitting. It enables you to explore, build more and more complicated models of data, and still keep track of what your models stand for, where their weaknesses are, and how to improve them.  
</Expand>

## 🚀 What's next? <a id="next-steps"></a>

In the [next chapter](06-machine_learning), we'll see how KL divergence explains the choice of loss functions used in machine learning.


=================================================================================
=================================================================================
CHAPTER: Loss functions
FILE: 06-machine_learning.mdx
=================================================================================
=================================================================================

# Loss functions

At last, the final chapter! We'll now leverage our newfound KL superpowers to tackle machine learning, or at least, understand a crucial aspect of it: [setting up loss functions](00-introduction/machine-learning). 

The core insight here is that **KL divergence guides us from a rough idea about important data aspects to a concrete estimation algorithm**. Specifically, we can use the _maximum entropy principle_ to transform our initial concept into a fully probabilistic model, and then apply _maximum likelihood_ to derive a loss function for optimization.

We will explore the examples in the following table (feel free to skip some) and illuminate the origins of their respective loss functions.

![Examples](06-machine_learning/table.png)

<KeyTakeaway>
Maximum entropy and maximum likelihood principles explain many machine-learning algorithms. 
</KeyTakeaway>

## 📚 A Catalogue of Examples <a id="examples"></a>

<Expand headline="Estimating mean and variance"> <a id="application-to-statistics-riddle"></a>

Our [basic statistics riddle](00-introduction/statistics) posed the following: Given a set of numbers $X_1, \dots, X_n$, how do we estimate their mean and variance?

We've already approached this riddle from various angles; now, let's combine our insights.

First, we transform the general idea that mean and variance are important into a concrete probabilistic model. The [maximum entropy principle](04-max_entropy) suggests modeling the data as independent samples drawn from [the gaussian distribution](04-max_entropy#normal).

Once we have a set of possible models—all Gaussian distributions—we can select the best one using [the maximum likelihood principle](03-minimizing#mle).

We want to find $\hat\mu, \hat\sigma^2$ that maximizes
<Math displayMode={true} math = "\hat\mu, \hat\sigma^2 = \argmin_{\mu, \sigma^2} \prod_{i = 1}^N \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(X_i-\mu)^2}{2\sigma^2}}"/>
It's typically easier to write down the logarithm of the likelihood function, i.e., the log-likelihood. This is not too surprising since [we understand](03-minimizing#mle) that maximizing log-likelihood is a synonym to minimizing KL divergence. If we make the problem simpler for us and consider only the estimation of the mean $\mu$, the equation simplifies like this:

<Math displayMode={true} math = "\hat\mu = \argmin_{\mu} \sum_{i = 1}^N (X_i-\mu)^2"/>

In this specific case, the optimization problem has a closed-form solution $\hat\mu = \frac{1}{N} \cdot \sum_{i = 1}^N X_i$ (and the formula for $\hat\sigma^2$ is analogous). Notice that while our formulas themselves don't explicitly mention probabilities, probabilities are essential for understanding the underlying mechanics.

What I want to emphasize is how our only initial assumption about the data was simply, "we have a bunch of numbers, and we care about their mean and variance." The rest flowed automatically from our understanding of KL divergence. 

</Expand>
<Expand headline="Linear regression"> <a id="linear-regression"></a>

Suppose we are given a list of pairs $(x_1, y_1), \dots, (x_n, y_n)$. We believe the data exhibits a roughly linear dependency, meaning there exist some constants $a,b$ such that $y_i \approx a\cdot x_i + b$. Our objective is to determine $a$ and $b$.

Let's transform this into a concrete probabilistic model. We'll model the data by assuming $y_i$ originates from the distribution $a\cdot x_i + b + \text{noise}$.<Footnote>We could also model the distribution from which $x_i$'s are drawn, but that won't be relevant for our current goal.</Footnote>

The noise is generated from a real-valued distribution. How do we choose it? The uniform distribution doesn't normalize over real numbers, making it unsuitable; the same applies to the exponential distribution. The next logical choice is the **Gaussian distribution** $N(\mu, \sigma^2)$, so let's select that. This introduces a slight complication as we now have two new parameters, $\mu, \sigma^2$, in our model $y_i \sim a\cdot x_i + b + N(\mu, \sigma^2)$, even though we primarily care about $a$ and $b$.

But this is fine. First, we can assume $\mu = 0$, because otherwise, we could replace $N(\mu, \sigma^2)$ with $N(0, \sigma^2)$ and $b$ with $b + \mu$ to achieve the same data model. We'll address $\sigma$ in a moment.

Let's proceed with our recipe and apply the maximum likelihood principle. We write down the likelihood of our data given our model:

<Math displayMode={true} math = "P((x_1, y_1), \dots, (x_n, y_n) | a, b, \sigma^2, x_1, \dots, x_n) = \prod_{i = 1}^n \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(ax_i + b - y_i)^2}{2\sigma^2}} " />

As usual, it's simpler to consider the log-likelihood (or cross-entropy):

<Math displayMode={true} math = "\log P(\text{data} | \text{parameters}) = -\frac{n}{2}\ln(2\pi\sigma^2) - \frac{1}{2\sigma^2} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2"/>

This expression appears rather complex, but we notice that for any fixed value of $\sigma^2$, the optimization problem for $a,b$ reduces to minimizing:

<Math displayMode = {true} math = "\hat{a}, \hat{b} = \argmin_{a,b} \sum_{i=1}^n (a\cdot x_i + b - y_i)^2"/>

Therefore, we can effectively disregard the added parameter $\sigma^2$<Footnote>Statistical software like R or Python's statsmodels also outputs $\sigma^2$. This can be helpful if you also, given some new point $x_{n+1}$, want not just to predict $y_{n+1}$, but also its error bars.</Footnote> and simply optimize above expression, which is the classical [least-squares loss function](https://en.wikipedia.org/wiki/Ordinary_least_squares) for linear regression.<Footnote>Typically, more variables $x^1, \dots, x^k$ are used to predict $y$. This leads to more complex formulas, but the derivation remains the same.</Footnote> Notice how the square in the loss function emerged directly from our maximum entropy assumption of Gaussian noise.

<Expand headline="Variants of linear regression">

Notice how our approach offers considerable flexibility, allowing us to incorporate additional information about the data into the model.

For example, perhaps we believe that the parameters $a$ and $b$ should be small. Our framework suggests augmenting the model by adding the prior $a,b \sim N(0, w^2)$, for some value $w$. This $w$ must be provided either by guessing or by employing another machine learning technique like [cross-validation](https://en.wikipedia.org/wiki/Cross-validation_(statistics)). This leads to optimizing $\sum_{i=1}^n (a\cdot x_i + b - y_i)^2 + \frac{1}{w^2}(a^2 + b^2)$, a method known as [Ridge regression](https://en.wikipedia.org/wiki/Ridge_regression).

As another illustration, consider the more general scenario where we have numerous predictors $x^1, \dots, x^k$, but we suspect that only a small fraction of them, say $0 < p < 1$, are genuinely useful. For the remaining predictors, the corresponding coefficient $a_i$ is zero. Our framework suggests that we should optimize:

<Math displayMode={true} math = "\min_{\substack{S \subseteq \{1, \dots, k\}, \\ |S|=pk}} \sum_{i=1}^n \left| \sum_{j \in S} a_j\cdot x_i^j - y_i\right|^2" />

The challenge is that optimizing this function is computationally difficult (in fact, NP-hard)—testing all possible subsets of nonzero coefficients and fitting each one takes exponential time. However, more advanced mathematical insights demonstrate that optimizing a different objective, called Lasso, often effectively solves this complex problem.<Footnote>See e.g. [10.6 here](https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html) or [this book](https://link.springer.com/book/10.1007/978-3-642-20192-9)</Footnote> Therefore, you should consider **Lasso** as an attempt to solve our probabilistic model under the assumption that "only a fraction of variables are relevant."
</Expand>
</Expand>


<Expand headline="K-means clustering"> <a id="k-means-clustering"></a>

We are given a set of points $x_1, \dots, x_n$ on, say, a 2D plane. Our objective is to group them into $k$ clusters.

Let's transform this into a probabilistic model. We'll use $\mu_1, \dots, \mu_k$ to represent the centers of these clusters. The significance of these points is that if a point $x_i$ belongs to cluster $j$, then its Euclidean distance $||x_i - \mu_j||$ should be small.

As before, we can employ the maximum entropy distribution to construct a concrete model. Since the exponential function doesn't normalize, we will use the Normal distribution:

<Math displayMode={true} math = "p(x | \mu_j) \propto e^{-\frac{||x-\mu_j||^2}{2\sigma^2}}"/>

The notation $p(x | \mu_j)$ signifies that this is our model for points originating from the $j$-th cluster. However, we desire a complete probabilistic model $p(x)$. We can achieve this by assigning a prior probability to how likely each cluster is. The maximum entropy prior is the uniform distribution, so we will choose:

<Math displayMode={true} math = "p(x) = \frac{1}{k} \sum_{j = 1}^k p(x | \mu_j)"/>

We now have a probabilistic model that generates data $x$ from a distribution $p$. It's parameterized by $k+1$ values: $\mu_1, \dots, \mu_k$, and $\sigma^2$. We will use maximum likelihood to determine these parameters. The principle dictates that we should maximize the following log-likelihood:

<Math displayMode = {true} math = "\argmax_{\substack{\mu_1, \dots, \mu_k \\ \sigma^2}} -n \log \left( k\sqrt{2\pi\sigma^2}\right) + \sum_{i = 1}^n  \log \sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}"/>

Optimizing this expression corresponds to an algorithm known as [soft $k$-means](https://en.wikipedia.org/wiki/Fuzzy_clustering). The term "soft" indicates that the parameter $\sigma$ allows us to output a probability distribution for each point $x$, indicating its likelihood of belonging to each cluster.

In practice, people typically don't care that much about probabilistic assignment in $k$-means; knowing the closest cluster is usually sufficient. This corresponds to considering the limit as $\sigma \rightarrow 0$. In this limit, the messy expression above simplifies quite elegantly. Specifically, we can replace the summation <Math math = "\sum_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}" /> with <Math math = "\max_{j = 1}^k e^{-\frac{||x_i-\mu_j||^2}{2\sigma^2}}" /> because all terms in the sum, except the largest one, become negligible as $\sigma \rightarrow 0$. The expression then simplifies to:

<Math displayMode = {true} math = "\argmin_{\substack{\mu_1, \dots, \mu_k}} \sum_{i = 1}^n \min_{j = 1}^k ||x_i-\mu_j||^2"/>

The problem of finding $\mu_1, \dots, \mu_k$ that minimize this expression is called [$k$-means](https://en.wikipedia.org/wiki/K-means_clustering).
</Expand>



<Expand headline="Logistic regression"> <a id="logistic-regression"></a>

This time, we're presented with red and blue points on a plane, and our goal is to find the optimal line that separates them. Ideally, all red points would be on one side and all blue points on the other, but this isn't always achievable. In such cases, how do we determine the "best" separating line? <Footnote>Sometimes, people use the term "logistic regression" for 1D version of this where we have red and blue points on a line and want to split the line into two parts. Our algorithm works for any number of dimensions. </Footnote>

It will be easier to represent the line not as $y = ax+b$, but using its normal vector $\theta$ (orthogonal to the line) and the distance $\delta$ of the origin from the line, as shown in the image below.<Footnote>Specifically, $\theta = \frac{1}{a^2+1} (a, -1)$ and $\delta = |b|/\sqrt{a^2+1}$, but let's not get bogged down in those details.</Footnote>

![Logistic regression](06-machine_learning/logistic.png)

Given a point $(x, y)$, the crucial quantity is its distance from our line. This can be calculated using the dot product as $\theta \cdot (x, y) + \delta$.

Now, employing the maximum entropy principle, we construct a probabilistic model that transforms this distance into a probability of color. We utilize the [logistic function](04-max_entropy). That is, our model states:
<Math displayMode={true} math = "p(\textrm{red} | (x, y)) = \sigma\left( \lambda (\theta \cdot (x, y) + \delta) \right)"/>
where $\sigma$ is the logistic function $\sigma(x) = e^x / (1+e^x)$. Naturally, we also have <Math displayMode={false} math = "p(\textrm{blue} | (x, y)) = 1 - p(\textrm{red} | (x, y)). " />

The constant $\lambda$ is a new parameter that the max-entropy principle compels us to add to our probabilistic model. Fortunately, it's quite a useful parameter—it quantifies our confidence in the classification. This is convenient because if we want to classify a new point in the future, we can not only assign it a red/blue color based on which side of the line it falls, but also use the equation above to compute how certain we are about our classification.

Once we have a model, we can apply the maximum likelihood principle to find its parameters. This principle instructs us to find $a,b,\lambda$ that minimize the following log-likelihood:

<Math displayMode = {true} math = "\argmin_{\theta, \delta, \lambda} \sum_{i = 1}^n \ell_i \log \sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)) + (1-\ell_i) \log (1-\sigma(\lambda (\theta \cdot (x_i,y_i) + \delta)))"/>

where $\ell_i$ is an indicator variable (i.e., $\ell_i \in \{0,1\}$) denoting whether the point $(x_i,y_i)$ is red. This problem, known as [logistic regression](https://en.wikipedia.org/wiki/Logistic_regression), is hard to solve exactly (NP-hard in particular), but gradient descent typically works well.
</Expand>



<Expand headline="Classification by neural networks"> <a id="neural-nets"></a>

We are provided with a vast collection of images, each assigned one of $k$ possible labels (e.g., a dog, a muffin). Our goal is to optimize a neural network that takes an image as input and outputs a probability distribution over these $k$ possible classes.

![dogs](06-machine_learning/dogs.png "taken from https://www.freecodecamp.org/news/chihuahua-or-muffin-my-search-for-the-best-computer-vision-api-cbda4d6b425d/")

Designing the architecture of a neural network is an extremely intricate problem that cannot be "solved" simply by name-dropping KL divergence. However, maximum entropy does offer some assistance: [we've already discussed](04-max_entropy#softmax) that the final layer of the network typically converts logits into probabilities using a softmax function. That is, if we build a neural network that transforms an input image $X$ into $k$ numbers $NN_1(X), \dots, NN_k(X)$, we should map them into probabilities as <Math math = "p_j(X) \propto e^{\lambda NN_j(X)}" />. The constant $\lambda$ can be optimized alongside the network's weights or simply hardcoded to $1$.

Next, the maximum likelihood principle states that we should maximize the log-likelihood. This means that if for an image $X_i$ with label $\ell_i$, the network outputs a distribution $p_1(X_i), \dots, p_k(X_i)$, we should aim to maximize:
<Math displayMode={true} math = "\argmax_{\substack{\textrm{neural net \\ weights}}} \sum_{i = 1}^n \log p_{\ell_i}(X_i)"/>

Maximizing the log-likelihood is equivalent to minimizing cross-entropy. Therefore, in this context, we usually refer to this as _training the network by minimizing the cross-entropy loss <Math math = "\sum_{i = 1}^n \log 1/p_{\ell_i}(X_i)" />._
</Expand>

<Expand advanced={true} headline="Variational autoencoders"> <a id="variational-autoencoders"></a>

Here's an observation relevant to the previous example as well. When we store images on a hard drive, we do so pixel by pixel, i.e., in the *pixel space*. However, in our brains, we store them very differently; perhaps we remember "it was a picture of a brown dog that looked like a muffin," or something similar. This corresponds to utilizing what's called the *latent space*. This is a hypothesized space where two images are considered "close" if they refer to similar objects. For instance, two images might be close in the latent space even if they are extremely far apart in the pixel space.

The ability to represent the latent space is crucial for any interesting work involving images. In fact, the reason we could separate dogs and muffins in the previous example was that the inner layers of the network were able to access concepts in the latent space, such as "are there ears in the picture."

As the next step, we now desire a system that can not only classify images but also generate new ones from scratch (think DALL-E or Midjourney) or do stuff like interpolating between two images *in the latent space* (see e.g. [this video](https://nvlabs-fi-cdn.nvidia.com/stylegan2-ada-pytorch/videos/interpolations-ffhq.mp4) that uses a different architecture than autoencoders). 

An autoencoder (see below) is a neural network architecture that can do this more interesting stuff. It processes an input image $x$ through an encoder, $\textrm{Enc}(x)$, compressing it into a smaller list of numbers $y$. Subsequently, a decoder, $\textrm{Dec}(y)$, attempts to reconstruct the original image $x$. The hope is that due to the bottleneck in the middle, $y$ captures the essential aspects of image $x$ while discarding less important ones. In other words, the encoder is hoped to encode the image into the latent space.

One challenge with traditional autoencoders is their tendency to learn a "hash function": The decoder might simply memorize all images $x_1, x_2, \dots$, and the encoder and decoder then decide on "names" for these images. The encoder then merely converts an input image to its name, and the decoder outputs the image associated with that name. To combat this issue, practitioners use variational autoencoders. These are autoencoders where the encoder outputs two lists: $\mu_1, \dots, \mu_d$ and $\sigma^2_1, \dots, \sigma^2_d$. The input to the decoder consists of $d$ samples drawn from $N(\mu_1, \sigma_1^2), \dots, N(\mu_d, \sigma_d^2)$. By introducing noise in the middle of the architecture, it becomes more difficult for the network to "cheat" by simply memorizing all images.

![vae](06-machine_learning/vae.png "image from https://en.wikipedia.org/wiki/Variational_autoencoder#/media/File:VAE_Basic.png")

The significant question now is: How do we optimize the variational autoencoder? Specifically, what is the loss function to minimize? Let's try to derive it! This will be more challenging than previous examples, hopefully demonstrating the depth of what we've learned in this minicourse!

Where do we begin? The first item on our to-do list is to formulate a probabilistic model of our data. In this example, we are interested in the joint distribution $p(x, y)$ over images—where $x$ represents the image in pixel space, and $y$ represents it in latent space. Notice that we are working with a probability distribution; a particular $y$ corresponds to an entire distribution over images that capture the concept of $y$, not just a single image.

Now, the encoder and decoder represent two distinct ways in which we can factorize the joint distribution.
The encoder corresponds to the factorization $p(x,y) = p(x) \cdot p(y | x)$: First, sample a random image and then encode it into the latent space. The distribution $p(x)$ is known to us: it's the empirical distribution over the large dataset of images we collected for training our autoencoder.
Unfortunately, the distribution $p(y | x)$ is not known, but the encoder attempts to represent it. More precisely, the distribution $p(y | x)$ is approximated by <Math math = "p'(y | x) = N(\textrm{Enc}_\mu(x), \textrm{Enc}_{\sigma^2}(x))" />.

The decoder provides us with a second way to model the data: We first sample a random latent-space representation and then decode it into an image, i.e., $p(x,y) = p(y) \cdot p(x|y)$. We need to be more creative to transform this idea into a concrete probabilistic model. For a start, we don't know the marginal distribution $p(y)$; so we will simply model it with a Gaussian distribution $q(y) = N(0, I)$ ($I$ represents the identity matrix). How should we model $p(x|y)$? Using $\textrm{Dec}(y)$ is a good starting point, but we should also introduce some randomness, so let's add Gaussian noise $N(0,1)$ to every pixel of the final image and model it as $q(x|y) = N(\textrm{Dec}(y), I)$. We have arrived at a different probabilistic model for $p(x,y)$, namely $p(x,y) = q(y) \cdot q(x|y)$.

We will optimize our variational autoencoder by minimizing the KL divergence between these two models of $p(x,y)$. When using KL divergence, we typically prefer the first parameter to represent the "truth" and the second to be a model of it. In this instance, both distributions are models that we will train in unison. However, the first model, $p(x,y) = p(x) \cdot p'(y|x)$, is closer to the truth since it incorporates the actual data $p(x)$, while the second model is primarily a collection of parameters we wish to optimize. Thus, we will train our network by minimizing:

<Math displayMode={true} math = "D\left( p(x) \cdot p'(y | x), q(y) \cdot q(x|y)\right)" />

Finishing the job now boils down to algebra that I hid in the following Expand box so as not to scare you right away. 
<Expand headline="Algebra part">
Let's call our KL loss function $\mathcal L$. We can decompose it into two parts, known as the **reconstruction loss** and the **regularization term**, as follows:
<Math displayMode = {true} math = "\mathcal L = \underbrace{\sum_{x,y} p(x) p'(y|x) \log \frac{p(x)}{q(x|y)}}_{\textrm{Reconstruction loss } \mathcal L_1} + \underbrace{\sum_{x,y} p(x) p'(y|x) \log \frac{p'(y|x)}{q(y)}}_{\textrm{Regularization term } \mathcal L_2} "/>

Let's analyze each term in turn, starting with the reconstruction loss.

### Reconstruction Loss
We can further expand the term $\mathcal L_1$ as:
<Math displayMode={true} math = "\mathcal L_1 = \sum_x p(x) \log p(x) - \sum_{x,y} p(x) p'(y|x) \log q(x|y)"/>
The first term is simply the entropy of the distribution $p(x)$. In our case, $p(x)$ is a uniform distribution over $N$ images $X_1, \dots, X_N$, so it equals $\log N$. In any event, this term is a constant independent of all the parameters we optimize, so we can disregard it. Thus, minimizing $\mathcal L_1$ amounts to minimizing the second term, which we will now interpret.

To do this, recall that $q(x|y)$ involves running the decoder on $y$ and adding Gaussian noise $N(0,1)$ to the result; we therefore have
<Math displayMode={true} math = "q(x | y) \propto e^{-\frac{\| x - \textrm{Dec}(y)\|^2}{2d}}"/>
and hence, up to an additive constant that does not affect our optimization problem, we have
<Math displayMode={true} math = "\log q(x | y) = -\frac{\| x - \textrm{Dec}(y)\|^2}{2d}"/>

So, if we were in the setup of a regular autoencoder where $p'(y|x)$ is a deterministic encoding $\textrm{Enc}(x)$, minimizing the term $\mathcal L_1$ would reduce to minimizing the mean square *reconstruction* loss:
<Math displayMode={true} math = "\frac{1}{N}\sum_{i = 1}^N \frac{\| X_i - \textrm{Dec}(\textrm{Enc}(X_i))\|^2}{2d}. " />

Our case is more complex; we need to minimize:
<Math displayMode={true} math = "\frac{1}{N}\sum_{i = 1}^N \sum_{y} p'(y|X_i) \frac{\| X_i - \textrm{Dec}(y)\|^2}{2d}. " />

The term $p'(y|x)$, which samples from <Math math = "N(\textrm{Enc}_\mu(x), \textrm{Enc}_{\sigma^2}(x))" /> instead of being a deterministic encoding, is problematic to compute directly. We will discuss how to estimate this part of the loss function at the end.

### Regularization Term

Let's analyze the term <Math math = "\mathcal L_2 = \sum_{x,y} p(x) p'(y|x) \log \frac{p'(y|x)}{q(y)}" />. Remember, $p(x)$ is simply a uniform distribution over our image dataset, so we can rewrite this as:
<Math displayMode={true} math = "\mathcal L_2 = \sum_{i = 1}^N \frac{1}{N} \sum_y p'(y|X_i) \log \frac{p'(y|X_i)}{q(y)} = \sum_{i = 1}^N \frac{1}{N} D(p'(y|X_i), q(y))"/>
Thus, minimizing this term reduces to minimizing the sum of KL divergences between $p'(y|X_i)$ and $q(y)$ across our dataset $X_1, \dots, X_N$.

The first distribution $p'(y |X_i)$ is simply a Gaussian with mean $\textrm{Enc}_\mu(X_i)$ and variance that is a diagonal matrix with entries <Math math = "\textrm{Enc}_{\sigma^2}(X_i)" />. The second distribution $q(y)$ is precisely the Gaussian $N(0,I)$. There's a [simple formula](https://leenashekhar.github.io/2019-01-30-KL-Divergence/) for the KL divergence between two Gaussians that looks like this:
<Math displayMode = {true} math = "D(N(\mu, \sigma^2), N(0, I)) = \frac12 \sum_{j = 1}^d \left( \mu_j^2 + \sigma_j^2 - 1 - \log\sigma_j^2\right) "/>

Plugging this into $\mathcal L_2$, we find that we need to minimize the expression:
<Math displayMode = {true} math = "\frac{1}{N} \sum_{i = 1}^N \left( \frac12 \sum_{j = 1}^d \textrm{Enc}_{\mu, j}(X_i)^2 + \textrm{Enc}_{\sigma^2, j}(X_i) - \log \textrm{Enc}_{\sigma^2, j}(X_i) \right)"/>
This is called the regularization term since it ensures that our variational autoencoder can't simply degenerate into a vanilla autoencoder by setting $\sigma_i^2 = 0$.
</Expand>

After performing the algebra, we arrive at the following loss function:
<Math displayMode={true} math = "\frac{1}{N} \sum_{i = 1}^N \left( \sum_y p'(y | X_i) \frac{\| X_i - \textrm{Dec}(y)\|^2}{2d} \,+\, \left( \frac12 \sum_{j = 1}^d \textrm{Enc}_{\mu, j}(X_i)^2 + \textrm{Enc}_{\sigma^2, j}(X_i) - \log \textrm{Enc}_{\sigma^2, j}(X_i) \right)\right)"/>

In general, computing the expression <Math math = "\sum_{i = 1}^N \sum_y p'(y | X_i) \frac{\| X_i - \textrm{Dec}(y)\|^2}{2d}"/> is super hard (NP-hard), as it would require iterating over all the whole range of $p'(y|X_i)$. In practice, this expression can be estimated using the Monte Carlo method. 
That is, for each image $X_i$, we simply sample a few times from $p'(y|X_i)$ and compute the reconstruction loss $\| X_i - \textrm{Dec}(y)\|^2$. We estimate the expectation $E_y$ by plugging in these few samples. 
</Expand>

You are the master of KL, congrats! 

If you want to know even more, click on the Danger button in the menu. It reveals bonus riddles & chapters. Also, it reveals some advanced Expand blocks in the chapters you already read. All bonus content is marked with ⚠️. Also, check out [Resources](../resources) and leave us feedback at the [About](../about) page.


TODO Add FREE intelligence test widget. 


## 🧠 Human vs AI: Next Letter Prediction

Inspired by Shannon's original experiment, you can now test your own next-letter prediction abilities against modern language models! The widget below shows you partial sentences from Wikipedia and asks you to guess the missing letter. Your score is based on how many attempts it takes you to find the correct letter.

<LetterPredictionWidget />



################################################################################
PART III: COMPRESSION (BONUS CHAPTERS)
################################################################################

=================================================================================
=================================================================================
CHAPTER: Coding theory
FILE: 09-coding_theory.mdx
=================================================================================
=================================================================================

# Coding Theory

Entropy is deeply connected to the topic of compression. In this chapter, we will discuss the connection and see how LLMs can be interpreted as compressing algorithms. 

<KeyTakeaway>
Entropy is the unbeatable lower bound for lossless compression, if we treat text symbols independently.  
</KeyTakeaway>


## 📝 Code intro
Say you've got a long DNA string built from letters $\{\mathsf{A},\mathsf{C},\mathsf{G},\mathsf{T}\}$. You want to store it using as little disk space as possible.  

Here's the most basic plan: We assign a binary code for each letter and encode the string using that code. 

For example, we can use <Math math = "\mathsf{A} \rightarrow \textsf{00}, \mathsf{C} \rightarrow \textsf{01}, \mathsf{G} \rightarrow \textsf{10}, \mathsf{T} \rightarrow \textsf{11} " />. The string gets stored using just 2 bits per letter. Done! 

Can we do better? Sometimes, yes! Here's a riddle: try to build a code that encodes the following string with 1.75 bits per letter on average. 

While playing, notice that when you e.g. use the code $\mathsf{A} \rightarrow \textsf{0}$, no other letter can get a code-name starting with $\textsf{0}$. The reason is that such a code may not be decodable. E.g., if you use codes <Math  math = "\textsf{0}" /> and <Math  math = "\textsf{00}" />, how do you decode <Math  math = "\textsf{00}" />?

<BuildYourOwnCodeWidget /> 



.

.

SPOILER


.

.

Here's the solution: <Math math = "\mathsf{A} \rightarrow \textsf{0}, \mathsf{C} \rightarrow \textsf{10}, \mathsf{G} \rightarrow \textsf{110}, \mathsf{T} \rightarrow \textsf{111} " />. 
Since the letter frequencies in the text are <Math math = "\frac12, \frac14, \frac18, \frac18"/>, this encoding only uses 
<Math displayMode={true} id = "code-example" math = "\frac12 \cdot 1 + \frac14 \cdot 2 + \frac18 \cdot 3 + \frac18 \cdot 3 = 1.75" />
bits per letter.  

OK, using shorter codes for more frequent letters makes sense, but what's the best way to do this? Coding theory knows the answer. Roughly speaking, it tells us to __try to give a letter with frequency $p_i$ a code-name of length $\log 1/p_i$__. 

For example, looking at <EqRef id = "code-example"/>, you can rewrite the left-hand side as: 
<Math displayMode={true} id = "code-example2" math = " \frac12 \cdot \log \frac{1}{1/2} + \frac14 \cdot \log \frac{1}{1/4} + \frac18 \cdot \log \frac{1}{1/8} + \frac18 \cdot \log\frac{1}{1/8}. " />
Every letter with frequency $p$ got code-name of length exactly $\log 1/p$! Notice that for general strings of length $N$, the length of codes satisfying the $p \rightarrow \log 1/p$ rule is this: 
<Math displayMode={true} math = "N \cdot \sum_{i = 1}^k p_i \cdot \log \frac{1}{p_i} = N \cdot H(p)." />
That is, if you manage to construct a code with $p \rightarrow \log 1/p$, you spend $H(p)$ bits per letter on average. 

If we implement our $p \rightarrow \log 1/p$-rule-of-thumb with the most direct algorithm possible, we get what's known as Shannon's code. This code sorts the letter-frequencies down from the largest one, and assigns to each letter of frequency $p$ a code of length $\lceil \log \frac{1}{p} \rceil$ (we round up because we can't have a code name with 1.5 bits). Here it is for English alphabet:

<ShannonCodeWidget />

You can notice that the number of bits per letter (also called _rate_) is a bit north of the entropy of the underlying distribution. This is because of the rounding $\log 1/p \rightarrow \lceil \log 1/p \rceil$. For example, if $p = 0.49$, we would like to give the letter a code name of length $\log \frac{1}{0.49} \approx 1.03$. Too bad that code names have to be integers and Shannon's code assigns it a code name of length $2$. As a general rule, Shannon's code can use up to 1 bit per letter more than what's the entropy. <Footnote>Try to work out the details of what's happening in Shannon's code. Especially: Why does Shannon's algorithm of assigning letters never runs out of available code names? </Footnote>

Unfortunately, there are situations where Shannon's code is really almost 1 bit worse than the entropy. Take a string that uses just two characters $\mathsf{A}, \mathsf{B}$, but the frequency of $\mathsf{B}$ is close to zero. Then, the entropy is close to zero, but Shannon can't do better than 1 bit per letter. 


### 📜 The source coding theorem <a id="source-coding"></a>

The [source coding theorem](https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem) is the most important theorem in coding theory. It basically says that on one hand, there are codes that get very close to the entropy bound. On the other hand, you can't beat that bound. 

Here's the setup of the theorem more precisely. We model texts like this: There is a source that has a distribution over letters. This source keeps sampling letters independently, and sends them to us. This goes on for a long time, say $n$ steps; our goal is to save some binary string to the memory so that later on, we can recover from that string what $n$ letters the source sent. 

This setup with the source sampling independent letters models that we only want to think about the problem of giving code names to letters based on frequencies. We are not trying to use the _correlations_ like '$\mathsf{th}$ often follows by $\mathsf{e}$' to get better compression.  

The source coding theorem says that first, there's a way to store the emitted string, using close to $H(p)$ bits per letter. We have come close to that bound above - Shannon's code is only 1 bit worse than entropy. But with more complicated codes, we can even get rid of this 1-bit slack (at the expense that the code is no longer as simple as mapping single letters to code names). 

<Expand advanced={true} headline="More on better codes">

There are two simple ways to get rid of the 1-bit slack. 

### Shannon's code on tuples
Think of constructing Shannon's code not for every letter, but for every _pair of letters_ (i.e., the alphabet grows from $26$ to $26^2$). If Shannon's code loses 1 bit per encoded letter-pair, it means it loses $1/2$ bits per actual letter! Doing this trick not for a pair of letters but a tuple of several letters can bring us arbitrarily close to a code that spends $H(p)$ bits per letter. 

This is a theoretical argument why we can reach the entropy limit. It's not very practical, though, since the alphabet gets very larger pretty soon ($26^2$ for pairs, $26^3$ for triples, ...). 

### Arithmetic coding
[Arithmetic coding](https://en.wikipedia.org/wiki/Arithmetic_coding) is a much better way to encode strings into binary, and it's widely used in practice. 

[todo drop or widget]

</Expand>

The second part of the theorem says that we can't beat the rate $H(p)$. Details for that in the expand box. 

<Expand advanced = {true} headline = "Details of Shannon's source coding theorem">
To see why we can't do better than $H(p)$ bits per letter on average, we will have to understand [Kraft's inequlaity](https://en.wikipedia.org/wiki/Kraft%E2%80%93McMillan_inequality). This inequality says that if we work with alphabet with $k$ letters and we build a code with words of lengths $\ell_1, \dots, \ell_k$, then it has to be the case that 
<Math id = "kraft" displayMode = {true} math = "\sum_{i = 1}^k 2^{- \ell_i} \le 1. " />

To understand this inequality, go back to widgets above - whenever we give a code-name to a letter, like <Math math="\mathsf{e} \rightarrow \textsf{000}" />, we can no longer use codewords that start with <Math math="\textsf{000}" /> for other letters, since that would create clashes. The node with <Math math="\textsf{000}" /> has to be a _leaf_. Some leaves 'take more space' than others - for example, using code name of <Math math="\textsf{0}" /> intuitively kills off half of the space of possibilities. 

A bit more formally, imagine continuing the full binary tree up to some very large depth $N$. Then a code word of length $\ell_i$ is above <Math math="2^{N - \ell_i}" /> of nodes at depth $N$. Since different code words cover disjoint intervals of depth-$N$ nodes, and there are $2^N$ nodes at depth $N$, it has to be the case for any valid code that 
<Math displayMode={true} math="\sum_{i = 1}^k 2^{N - \ell_i} \le 2^N" />
Divide by $2^N$ and you get Kraft's inequality <EqRef id = "kraft"/>. 

I actually like to think about Kraft's inequality as equality. Why? Well, if your code is such that the left-hand side is really smaller than $1$, then you are stupid. <Footnote>You can notice that Shannon's code above is 'stupid' since for English, it leaves some space at the right of the binary tree. In fact, Shannon's code is useful mostly for didactical reasons and in practice you would construct the code by [Huffman's algorithm](https://en.wikipedia.org/wiki/Huffman_coding). </Footnote> In the widget below, you can see how codes can be iteratively improved to get equality. 

<KraftInequalityWidget />


The reason why this is helpful is that I like to think about the numbers <Math math="q_i = 2^{-\ell_i}" /> as some kind of idealized probabilities. Widget above shows that we can pretty much assume that the numbers $q_i$ always sum up to 1. You can think about the numbers $q_i$ as the probability distribution _implied_ by your code-name lengths $\ell_i$. Intuitively, the code is optimized for the distribution $q$, not $p$. 

This setup with $p$ and $q$ is little bit like our discussions in the first two chapters. In fact, let's write down the fact that KL divergence between $p$ and $q$ is always nonnegative. Let's write it down in the form $H(p, q) \ge H(p)$:
<Math displayMode = {true} math="\sum_{i = 1}^k p_i \log \frac{1}{q_i} \ge \sum_{i = 1}^k p_i \log \frac{1}{p_i}" />
Plugging in <Math math="q_i = 2^{-\ell_i}" />, we get
<Math displayMode = {true} math="\sum_{i = 1}^k p_i \ell_i \ge H(p)." />
That is, the average code-name length is at least $H(p)$. This works for any code, hence the second part of [Shannon's source coding theorem](https://en.wikipedia.org/wiki/Shannon%27s_source_coding_theorem). 
</Expand>

## 🧠 Entropy intuition

Using the fact that good codes can achieve a rate close to entropy can give us a lot of intuition! Remember [how we defined](/02-crossentropy) entropy as the "average surprisal" of a distribution? We could also ask: if we keep sampling from the distribution, how many bits per flip do we need to store the results? 

For example, if we are flipping a fair coin and want to keep the results, there is nothing smarter then writing one bit <Math math="\textsf{0}" />/<Math math="\textsf{1}" /> for each heads/tails that we flipped. This is 1 bit per flip. 

But if we are flipping a biased coin where heads have only $0.01$ probability, there are better ways to store the results! For example, we could split the outcomes into batches of 10, and give a code-name to each of the $2^{10}$ possibilities in a batch. If we use short code-names for very probably outcomes - e.g., $\mathsf{TTTTTTTTTT} \rightarrow \textsf{0}$, we can spare a lot of disk space! <Footnote>This goes back to our discussion of how to improve the slack of one bit in Shannon's code. </Footnote>

The entropy of the coin flip is the rate of the best code, it's the speed of how much 'relevant information' we are generating with our flips.  

With coding theory intuitions, cross-entropy also becomes also very natural: it's how many bits you need when data comes from $p$ but you are using the code that's optimized for a different distribution $q$. For example, in the top widget, you can construct the best code for $\mathsf{AACATACG}$, but then run it on $\mathsf{AAAAAAAA}$. 

Finally, KL divergence (relative entropy) is how much worse your mismatched code is compared to the optimal one. 

We will now see more examples of how entropy and compression clicks. 

## 📦 Predictive coding and LLMs

So far, all our discussion was encoding the text letter-by-letter. This is not too hard. The real fun starts when we want to compress a given text _without the assumption that letters are independent_. We now want to use the fact that $\textsf{th}$ usually follows by $\textsf{e}$ to achieve as good compression as possible. 

Here is a generic approach of how most compressions algorithm work, called [predictive coding](). A generic predictive-coding algorithm goes through the text letter by letter and tries to build some kind of understanding of it. For each letter, it tries to predict it using the past text. As we know, once you have a distribution over the next letter, we can convert it to a code, e.g. Shannon's code. This way, we can encode the whole text.  

I want to explain two examples of predictive coding algorithms. The first example is how LLMs can be used to compress text, the second example would be a typical implementation of ZIP. 

### 🤖 LLMs 

LLMs are exactly fitting the description of our next-letter predictor. A small technicality - to make the prediction task easier, the text is first split into so-called tokens (think short words, syllables). The net then predicts the next token, not the next letter. 

We have discussed LLMs in the main text; they are trained by reading the Internet, minimizing the cross-entropy loss. But we can now understand that equivalently, __they are trained to compress Internet as much as possible__!  

In the next widget, you can see how it works. 

<GPT2CompressionWidget />

This way of compressing test is extremely efficient, since LLMs can predict the next token even more efficiently than us, people. The catch is that to use this to compression, we would have to send the LLM with the compressed text, so that the receiver can decode. Modern LLMs are huge, so this is not really practical. 

### 🗁️ ZIP 
Typical algorithm used in ZIP works like this: It reads the text and constructs a dictionary -- list of common patterns (syllables, words) that were frequent in the past. When it encounters a word it has in its dictionary, instead of writing 'divergence', it writes something like [now comes entry 42 in the dictionary]. The algorithm does not juggle with any probabilities. However, due to the connection of probabilties and code lengths, we can now understand that if the ZIP algorithm can at some position encode the word 'divergence' in 10 bits, we can interpret it as the ZIP algorithm __predicting__ that the probability of 'divergence' is $2^{-10}$. 

### 🕰️ Prediction = Compression

These two examples of predictive coding algorithms go back to our discussion of coding intuition for entropy. We defined entropy in the language of surprise, probabilities, prediction. Coding theory uses the language of codes, and compression. But since the probability $p$ corresponds both to surprise of $\log 1/p$ and ideal-code-length of $\log 1/p$, the math is the same for both. 

Hence, whenever there is a good prediction, there's a good compression, and vice versa. This is really super important and we will return to it in the [Kolmogorov complexity chapter](08-kolmogorov). 


## 🌐 How large is Wikipedia? <a id = "compression"></a>
We can now revisit [our Wikipedia riddle](00-introduction#wikipedia) about Hutter's compression challenge. Remember, the question is about how much can we compress a single 1GB file of English Wikipedia. Hutter is an AI researcher and he started his challenge because he understands very well the topic of this chapter - if you can compress text, you can also predict it, and that implies you have to have some kind of knowledge/intelligence.  

The honest answer is that we don't know (see the [Kolmogorov complexity](08-kolmogorov) chapter), but w

We broadly understand how well different algorithms compress English text. 

There are more approaches to compress text files. Let's go through them and you can see in the next widget how they fare for various types of data. 

- _Baseline_: The stadard way to store text files is UTF-8. Lying a bit, this format store each letter using 8 bits. <Footnote>Why is it lying? [UTF-8](https://en.wikipedia.org/wiki/UTF-8) itself is a beautiful example of good engineering inspired by coding theory. There are around 100 characters (English letters, digits) that are stored using 8 bits, fancier letters from reasonable alphabets are stored using 16 bits, and emojis like 😀 or hieroglyphs like 𓀀 take 32 bits. Classic coding theory—rare stuff gets longer codes. But English Wiki is mostly standard English letters, so 8 bits per character it is. </Footnote>

- _Optimal code_: Treat letters as independent, we can encode them using $H(p)$ bits per letter on average, where $p$ is the distribution of English letter frequencies. [In the Shannon's coding widget above](../02-crossentropy#construction), we saw that the entropy is around 4.2 bits. So, we can shrink the file by almost __2x__ just by using that different letters have different frequencies. 

- _Zipping_: Standard compression algorithms like those used in ZIP implement dictionaries to catch patterns that are often reused in the text. They can compress English text up to a factor around __3x__.  

- _LLMs_: Large Language Models are trained to predict text, hence they compress it. If we disregard the fact that technically speaking, LLM size should count towards the size of the compressed text, they compress English text around __7x__ for old LLMs like GPT-2 and up to perhaps __10x__ for state-of-the-art networks. 

I encourage you to play with the following widget, especially making GPT-2 compress your texts. 🙂

<CompressionWidget />

The best algorithms in Hutter's competition have compress by a factor of about 9x. But unfortunately, while the challenge is backed by a very deep understanding of the nature of intelligence, the precise parameters of the challenge make it hard to relate to the winning algorithms. Since the file size is 'only' 1GB, the compression-by-LLM approach doesn't easily work. You have to append the LLM to the compressed text and it becomes huge.<Footnote>Or you have to train it 'inside' the compression/decompression algorithm, and for that the file is too small. </Footnote> The winning algorithms are thus used on more 'combinatorial' approaches, like those used in ZIP or stuff like [multiplicative weights](07-algorithms). 

Finally, let me tell you about one of the coolest experiments I know of. Claude Shannon, the GOAT who invented information theory in the late 40s, did the following a few years after his invention. He measured the prediction ability of people: he showed them partial sentences and asked them to guess the next letter. This way, he figured that people can compress English to about 0.5 - 1 bits per letter, roughly on par with the performance of GPT2-4. <Footnote>TODO crunch the numbers more precisely. </Footnote> As far as I can say, this is the first experiment about next-token prediction; Claude Shannon was so based he did it 60+ years before it became cool!



=================================================================================
=================================================================================
CHAPTER: Kolmogorov complexity
FILE: 08-kolmogorov.mdx
=================================================================================
=================================================================================

# Kolmogorov Complexity

In the [previous chapter](09-coding_theory), we saw what entropy tells us about compressing strings, if we treat letters independently. But that's just an assumption that good compression algorithms can't make. 

Kolmogorov complexity is the answer to the conundrum. It is the ultimate limit on how much a file can be compressed. Its immense power is balanced by the fact that we can't really compute it. 
{/*My favorite applications of Kolmogorov complexity are not practical ones, but a clean conceptual framework for discussing these ideas.*/} 

<KeyTakeaway>
Kolmogorov complexity of an object is the length of its shortest specification. This is the ultimate limit of compression. 
</KeyTakeaway>

## 🌀 The Mandelbrot Set

Take a good look at the following picture.<Footnote>Be careful, though, excessive zooming may result in psychedelic experience. </Footnote> It shows a so called Mandelbrot set -- we color each pixel of the plane based on how quickly a certain sequence of numbers shoots to infinity. 

If you take print screen of this picture and save it on your disk, it's going to take a few MB. But what if you instead save the _instruction_ for how to create this image? All relevant ingredients are stored in the two boxes below the picture - the formula used to create it, and the coordinates of the plane you are looking at. We are talking about less than kilobyte of memory now. 

<MandelbrotExplorer />

This is the gist of Kolmogorov complexity. For any given object - say, represented as a binary string - it's Kolmogorov complexity is the length of the shortest program that prints that string. 

Here are a few more examples. 

- Although digits of $\pi$ have many random-like properties, the Kolmogorov complexity of its first million digits is extremely small. That's because there are some [extremely short](https://cs.uwaterloo.ca/~alopez-o/math-faq/mathtext/node12.html) programs printing it. 
- Larger numbers (written down in binary) typically have larger Kolmogorov complexity. But there are huge numbers like <Math math = "3^{3^{3^{3^3}}}" /> with very small Kolmogorov complexity.  
- Whenever you can ZIP a file to a size of 100MB, you can say that "Kolmogorov complexity of the file is at most 100MB"
- The Hutter's challenge from [coding theory chapter](09-coding_theory) is about estimating the Kolmogorov complexity of 1GB of Wikipedia
- If you keep flipping a coin $n$ times, the resulting sequence is likely to have Kolmogorov complexity of about $n$. There's no good way of compressing it.  


## 💻 Choosing the language

There is an awkward problem with the definition of Kolmogorov complexity. It's the length of the shortest program -- but what programming language do we use? Python? C? Assembly? Turing machine? Do we allow languages _and_ libraries? Printing million digits of $\pi$ can then reduce to this:

```
import sympy
print(sympy.N(sympy.pi, 1000000))
```

The important insight is that, at least if we stay on the theoretical side of things, the choice does not matter that much. The trick is that in any ([Turing-complete](https://en.wikipedia.org/wiki/Turing_completeness)) programming language, we can build an [interpreter](https://en.wikipedia.org/wiki/Interpreter_(computing)) of any other programming language. 
Interpreter is a piece of code that reads a code written in some other language, and executes its instructions. 

In any reasonable programming language, you can write an interpreter for any other reasonable language in at most, say, 1MB. But this means that Kolmogorov complexity of any object is fixed 'up to 1MB': If you have a 100MB Python script that prints the file, then you have a 101MB C, Assembly, Java, ... script printing the same file - just write a code where the first 1MB is an interpreter of Python tasked to execute the remaining 100MB. 

So for large objects (like the 1GB Wikipedia file from Hutter's prize), there's nothing awkward in using Kolmogorov complexity. The flip side is that it's pretty meaningless to argue whether the Kolmogorov complexity of $\pi$ is 200 or 300 bytes. That difference depends on the choice of programming language too much. 

## ⚖️ Kolmogorov vs entropy: $E[K(x)] \approx H(X)$ 

Both Kolmogorov complexity and entropy are trying to measure something very similar: complexity, information, compression limit. Naturally, there are closely connected. The connection goes like this: If you have a reasonable distribution ($X$) over bit strings and you sample from it ($x$), then the entropy of the distribution is roughly equal to the expected Kolmogorov complexity of the sample. I.e., <Math displayMode={false} math = "E[K(x)] \approx H(X)"/>. 

<Block headline = "Example: uniform distribution">
Let's see why this is true on an example. Take a sequence of $n$ fair coin flips. This is a uniform distribution over $2^n$ binary strings of length $n$. The entropy of this distribution is $n$. Now let's examine the Kolmogorov complexity. 

On one hand, the Kolmogorov complexity of any $n$-bit string is at most <Math displayMode={true} math = "K(\underbrace{\textsf{01000\dots 010110}}_{\textrm{$n$ bits}}) \le n + \textrm{something small}." /> That's because in any (reasonable) language, you can just print the string:

```
print('01000...010110')
```

But can the average Kolmogorov complexity be much smaller than $n$? Notice that our uniform distribution contains many strings with very small Kolmogorov complexity, like the string $000\dots 0$. The reason why those special snowflakes don't really matter on average is [coding theory](/08-coding_theory). 
We can construct a concrete code like this: for any string in our distribution, its code name is the shortest program that prints it.<Footnote>There is a subtlety here. Code has to be prefix-free: If $\mathsf{0}$ is a code, then <Math math = "\mathsf{01}"/> can't be a code. So, to interpret a program as a code name, our programming language has to be prefix-free -- no program can be a prefix of another program. This can be done e.g. by appending a [null-character at the end of the string](https://en.wikipedia.org/wiki/Null-terminated_string), or writing its length at the beginning. </Footnote> The average length of this code is exactly $E[K(x)]$. But [we have seen](/08-coding_theory#source-coding) that any code has its average length at least as big as the entropy. Hence, $E[K(x)] \ge H(X) = n$ and we have the formula:
<Math displayMode={true} math = "E[K(x)] \approx H(X)"/> 
</Block>

If you look at above proof sketch, you can notice that we did not really use that the distribution is uniform, it works pretty much for any distribution.<Footnote>There is an annoying detail. The distribution _itself_ can be hard to describe in the sense of having large Kolmogorov complexity. See e.g. 14.3 in [Elements of Information theory](http://staff.ustc.edu.cn/~cgong821/Wiley.Interscience.Elements.of.Information.Theory.Jul.2006.eBook-DDU.pdf). </Footnote> 

However, the case of a uniform distribution is the most interesting: It tells us that most $n$-bit strings can't really be compressed, since their Kolmogorov complexity is close to $n$! In fact, $n$-bit strings with Kolmogorov complexity $\ge n$ are called _Kolmogorov random_, to highlight the insight that __bits are random if we can't compress them__. 

<Expand headline="Long runs">
Think of a long $n$-bit string generated by flipping a fair coin $n$ times. What is the longest consecutive run of heads in such a string? You can use classical tools of probability theory like [Chernoff's inequality](https://en.wikipedia.org/wiki/Chernoff_bound) to compute that with high probability, the string won't contain runs of length more than $O(\log n)$. 

But there's also a more direct way to see this: If a bit string $s$ contains a large run of zeros of length $k$ at position $i$, i.e., 
<Math displayMode={true} math = "s = s_1 \underbrace{00\dots 0}_{k} s_2"/>

you need only store $s_1, s_2, k, i$ in memory. The overhead to store a few additional numbers is definitely less than $10 \log_2 n$ (the true constant factor is much better). The good part is that we store $k$ bits less. So, the Kolmogorov complexity of strings with pattern of $k$ zeros is 
<Math displayMode={true} math = "K(x) \le n - k + 10\log_2 n." />
If it was often the case that a random string contains a substring of zeros of length $> 10\log_2n$, we could use this trick to compress random strings on average. But that's not possible, so random strings typically can't have long runs of zeros. 

The true power of this view is that we can now understand why random strings can't have any long interesting patterns in them. If there were patterns, they would be predictable, and hence the strings compressible. But $E[K(x)] \ge H(X) = n$ says that this can't happen. 
</Expand>


## 🔮 Prediction, compression, and the Chinese room

In previous chapter, we talked about how prediction and compression are closely related. It may have looked a bit like some kind of algebraic trick - coincidentally, surprise is measured as $\log 1/p$ and lengths of good code name is also $\log 1/p$, so there's the connection between prediction and coding. 
Kolmogorov complexity gives a smooth language to talk about this connection. In particular, I find it especially helpful that we can talk about compression / Kolmogorov complexity without talking about probability distributions.  

Let's say we want to discuss how LLMs are "good at predicting the next token on Wikipedia" and make it more mathematically precise. Using the language of cross-entropy and entropy is a bit awkward - it has to involve some kind of distribution over inputs. We have to imagine some kind of abstruse probability distribution $p$ over thoughts about the world written in English. Then, let $q$ be the distribution over texts generated by running our LLM. The technical sense in which the LLM "is good at predicting" is that $H(p,q)$ is small. 

Using the language of compression, we can reformulate "being good at predicting Wikipedia" as "being good at compressing Wikipedia". For me, this is much more tangible! LLMs are simply smart enough not to find "Wikipedia" that surprising - as measured in bits that we have to store so that the LLM can recover the original text from them. This story about what's happening in LLMs does not require arguing about any distribution $p$ over all English texts. 

Here's a concrete example that helps illustrate these concepts. A philosopher called [John Searle](https://en.wikipedia.org/wiki/John_Searle) once proposed a thought experiment called [Chinese room](https://en.wikipedia.org/wiki/Chinese_room). 

Let me quickly explain the gist. <Footnote>There are more ways to interpret what the experiment is getting at, this is one interpretation. </Footnote> If you are from the older generation like me, you might remember that pre-2022, there was a thing called [Turing test](https://en.wikipedia.org/wiki/Turing_test):<Footnote>Somehow, people stopped talking about it after GPT-4-level models. </Footnote> Imagine that you can chat for a few minutes with an entity that is either a human, or an AI impersonating a human. If you can't reliably tell the two cases apart, Turing claims that we should concede that the AI is intelligent.  

But Searle objects: What if the AI was just a long list of rules? (In his experiment, he imagines a person locked in a room with a Chinese conversation rulebook) This was actually how some pre-deep learning AIs faked their way through short (5 minutes) Turing test games. The AIs were just an incredibly long lists of pattern matching rules like "If they seem to ask you about your favorite artist, tell them Madonna and ask them about their favorite artist. " This works for very short conversations, since it was relatively predictable what kind of questions the human judges are typically asking. 

<ImageGallery 
  images={[
    { src: "/fig/eliza.png", alt: "ELIZA" },
  ]}
  caption={`Pre-deep-learning chatbots like ELIZA are mostly just lists of common phrases, especially questions that pretend to be relevant. If you keep adding IFs and ELSEs, you get better models of human language. But there's no compression happenning, so the chatbot does not really generalize to new situations. `}
  fullWidth={true}
/>

The problem with this approach is that [it gets exponentially harder](https://arxiv.org/pdf/1108.1791) - for each additional minute of the immitation game, the number of rules included in the intelligence fakers has to grow by a multiplicative factor. That's because there is no _compression_ happening in those programs - they were not trying to _predict_ what happens in human-like conversations, they were just trying to list all of them. Thus, such programs never really _generalized_, they did not lead to new, interesting insights. And, Searle has a very good point that even if the programs can fool people on Turing test for a few minutes, there is not really much of an _understanding_ happening. 

This is of course very different for current AIs. As we now understand, they are literally trained to _predict_ human conversations and writings. Or, equivalently, they are trying to _compress_ them. This compression is the crucial difference from the earlier Turing-test-fakers. The architects of current AI like Ilya Sutskever understand this difference extremely well and it was the reason why they were optimistic about the overall approach of training general intelligence by modelling text. They understood that being good on the "simplistic" task of predicting the next token does not only force you to learn English words (GPT-1) or the basic grammar of a couple of languages (GPT-2). To get really good at predicting the next token, you have to [understand the underlying reality that led to the creation of that token](https://www.dwarkesh.com/p/ilya-sutskever). Understanding reality partially consists of learning facts, but more importantly, it requires intelligence to combine them. <Footnote>For some reason, people actually often use the Chinese room experiment to conclude that even the current AIs don't really understand the world, they are just '[stochastic parrots](https://en.wikipedia.org/wiki/Stochastic_parrot)'. I find it quite confusing since I think of the experiment as a great argument for why current AI _does_ understand the world. </Footnote>


## 🧠 Solomonoff prior & induction

What's the most natural distribution over all (finite) binary strings, if what we care about is their Kolmogorov complexity? The [maximum entropy principle](04-max_entropy) says we should consider the distribution <Math math = "p(x) \propto e^{- \lambda K(x)}" />, for some $\lambda$. In a minute, we will see that the right $\lambda$ is such that $p(x) \propto 2^{-K(x)}$ <Footnote>A quick intuition: Larger $\lambda$ makes the weight of long algorithms negligible, and smaller $\lambda$ will likely not even be normalizable. </Footnote> This distribution is called _Solomonoff prior_. <Footnote>todo maybe mention universal probability. </Footnote>

It's called _prior_ because this is how we typically want to use this distribution. Similarly to other maximum entropy distributions, this is where should start before we start making observations and updating it. I find it philosophically very appealing, feel free to check the expand boxes. 

<Expand advanced={true} headline = "Solomonoff induction" >
The reason why Solomonoff came up with the prior is that he used it to develop what's known as [Solomonoff induction](https://en.wikipedia.org/wiki/Solomonoff%27s_theory_of_inductive_inference) - a theory formalizing how reasoning is supposed to be done. This all sounds very abstract, so imagine that you are given a mysterious machine<Footnote>E.g. the universe if you are a physicist or LLM if you are a computer scientist. </Footnote> that you can poke into and it sometimes produces some outputs you can observe. You have a few hypotheses - models - for what's going on inside. The question is: what's the best model? 

A partial answer to the question is Bayes' rule from [the first chapter](01-kl_intro): Say that we start with some prior distribution over the models. Then, as we keep poking at the machine, we make observations that have different likelihoods under different models and Bayes' rule uses those likelihoods to update the prior. 

But what prior should we start with? Solomonoff offers his. This way, if the model $q$ has Kolmogorov $K(q)$ and the log-likelihood of our observations under that hypothesis is $L(q)$, Bayes' rule says that in the posterior, the hypothesis probability will be proportional to $2^{- K(q) + L(q)}$. That is, more complicated hypotheses are charged for their complexity by the prior. If you now want to select the most likely hypothesis, it should not be the one maximizing the log-likelihood (which is the suggestion of the [maximum likelihood principle](03-minimizing)), we should additionally regularize by Kolmogorov complexity. 

Here is a coding-theory intuition for why this makes sense. The hypothesis that is the most likely under Solomonoff prior is exactly the hypothesis that compresses the observed data the best. Remember, negative log-likelihood is just crossentropy. More concretely, if we use $p$ for the true distributions over the $n$ observations we see, we have $L(q) = -n \cdot H(p,q)$. So, maximizing $-K(q) + L(q)$ is really the same as minimizing $K(q) + n \cdot H(p, q)$. But this formula has very clear meaning - it is the number of bits needed to compress the observations by $q$. Indeed, we first have to store $q$ and then use coding theory to compress the observations with $H(p,q)$ bits per letter. <Footnote>Example: in our [coding theory chapter](09-coding_theory), we discussed the Hutter's challenge. State-of-the-art LLMs have top-notch $H(p,q)$ on Wikipedia, but humongous $K(q)$. On the other hand, using optimal code has so negligible $K(q)$ for texts of nontrivial length that we did not even discuss it in the [compression widget](09-coding-theory#compression) at that page. </Footnote>
</Expand>

<Expand advanced={true} headline = "Solving epistemology">

<ImageGallery 
  images={[
    { src: "/fig/epikuros.jpg", alt: "Epicurus" },
    { src: "/fig/William_of_Ockham.png", alt: "William of Ockham" },
    { src: "/fig/hume.jpg", alt: "David Hume" }
  ]}
  caption={`[Epicurus](https://en.wikipedia.org/wiki/Epicurus) (~300 BC) is the father of Epicureanism - a school of thought which is a kind of like an early atheism. [William of Ockham](https://en.wikipedia.org/wiki/William_of_Ockham) (~1400) was a medieval philosopher, now mostly known for his razor. [David Hume](https://en.wikipedia.org/wiki/David_Hume) (~1750) was an enlightement empiricist, claiming that our reasoning should be tracable back to some experience with the world - That's why he was super interested in the problem of induction! `}
/>

Imagine a special case of Solomonoff induction where each observation either is predicted by the model (likelihood = 1) or is not (likelihood = 0). Then, Solmonoff induction consists of crossing out models incompatible with data. The posterior distribution over the non-crossed models is very similar to the original Solomonoff prior: each hypothesis $q$ has probability proportional to $2^{-K(q)}$. This generalizes [Occam's razor](https://en.wikipedia.org/wiki/Occam%27s_razor) that says that we should prefer simple hypotheses, and [Epicurus principle](https://en.wikipedia.org/wiki/Epicurus#Principle_of_Multiple_Explanations) that says that if more hypothesis explain the data, we should not disregard any of them. 

Years later, an enlightment philosopher [David Hume](https://en.wikipedia.org/wiki/David_Hume) was struggling with [the problem of induction](https://en.wikipedia.org/wiki/Problem_of_induction). Basically: Even if we solve physics and find a perfectly good model of it $q$ that fits everything that happened so far, what about a model $q'$ that is the same as $q$ until tomorrow, but does some stupid rubbish afterwards? Hume was an empiricist and held that there's no good rational justification for preferring $q$ over $q'$. But Solomonoff induction is a pretty good "rational" answer, if you ask me!<Footnote>Of course, whether this is a satisfying answer depends on how we justified using the Solomonoff prior in the first place. I kind of pulled it out of a hat, but there are [nice](http://www.vetta.org/documents/Machine_Super_Intelligence.pdf) [theorems](https://link.springer.com/book/10.1007/978-0-387-49820-1) showing that it's in a sense a unique probability distribution. </Footnote> If you use that prior, you get Occam's razor: even if both hypotheses fit the data, the simpler one - $q$ - is much more probable. 
</Expand>

<Expand advanced={true} headline = "🐘 Von Neumann's elephant & overfitting">

[John von Neumann](https://en.wikipedia.org/wiki/John_von_Neumann) [allegedly](https://en.wikipedia.org/wiki/Von_Neumann%27s_elephant) said "With four parameters I can fit an elephant, and with five I can make him wiggle his trunk." This quote famously illustrates the danger of [_overfitting_](https://en.wikipedia.org/wiki/Overfitting): adding more parameters to a model can make it fit any data, but such a model won't generalize very well. 

The widget below shows von Neumann's elephant curve and other parametric curves. If you can make the elephant wiggle its trunk by adjusting the coefficients, let me know how you did it!

<ParametricCurveWidget />
</Expand>

<Expand advanced={true} headline = "AIC & BIC model selection" >
In practice, we can't compute Kolmogorov complexity, but we can estimate it as the number of parameters in the model: Instead of simply taking the model with minimum crossentropy loss (MLE), we should add a term $C \cdot k$ to the overall loss. Here, $k$ is the number of parameters and $C$ is 'how many bits per parameter'. If parameters are small numbers, we may opt for $C \approx 1$. If the parameters are some kind of real numbers, it is typically more sensible to think about them as having $O(\log n)$ bits. The choice of $C = 1$ is called [AIC](https://en.wikipedia.org/wiki/Akaike_information_criterion) and $C = \frac{1}{2}\ln n$ is called [BIC](https://en.wikipedia.org/wiki/Bayesian_information_criterion). Both of these choices are typically justified by a different argument with some more concrete assumptions. 

You can test both rules on the following widget that fits input points with a polynomial curve. The crossentropy is computed by so-called [cross-validation](https://en.wikipedia.org/wiki/Cross-validation_(statistics)), and you can see how the choice of the best model slightly differs between MLE, AIC, and BIC. 

<PolynomialRegressionWidget />

</Expand>


## 🔧 More Kolmogorov Applications

Kolmogorov complexity is incredibly helpful for understanding all kinds of fundamental questions. 

<Expand advanced={true} headline = "What the hell is randomness?"> 

If there is a person who we can call the 'father of probability theory', it would be [Pierre Laplace](https://en.wikipedia.org/wiki/Pierre-Simon_Laplace). Laplace lived around the year 1800. At this point in time, everybody, Laplace included, was amazed by how Newton seemingly solved physics (~1700) by postulating a few simple laws that seemingly described pretty much all there is. In fact, Laplace himself is an author of [Laplace demon](https://en.wikipedia.org/wiki/Laplace%27s_demon) - a thought experiment based on the idea that if you knew all the info about the present-state universe, you could deterministically simulate it and know all there is about the future. 

Yet, Laplace spent a lot of his time developing probability theory <Tooltip tooltip="![chesterton](/fig/chesterton2.jpg)">exactly</Tooltip> because he believed in the deterministic nature of the world. He understood that we can never know all there is to the world anyway. Hence, we need a language - probability - to talk about our epistemic uncertainty.  

When [Solomonoff](https://en.wikipedia.org/wiki/Ray_Solomonoff) and [Kolmogorov](https://en.wikipedia.org/wiki/Andrey_Kolmogorov) devoloped Kolmogorov complexity,<Footnote>Even though 'Kolmogorov complexity' sticked, Solomonoff was first by a couple of years. We are talking ~1960s. </Footnote> they came from similar angle. At the heart of the matter, probability is not about whether our world is governed by deterministic Newton laws, or what's your favorite intepretation of quantum physics. It's about modelling unpredictability. 

This kind of intuition is extremely helpful in computer science. Algorithms frequently want to work with random bits, but how do we get them fast? In practice, we typically use a [_pseudorandom generator_](https://en.wikipedia.org/wiki/Pseudorandom_generator): We ask the operating system for a [_seed_](https://en.wikipedia.org/wiki/Random_seed) of perhaps 64 'truly random' bits, that the system gets by e.g. measuring some hardware sensor. The pseudorandom generator is then a short piece of code that gets the 32 bits as the input and it repeatedly applies obscure mathematical operations to it to generate more randomly looking bits. 

How do we even talk about those pseudorandom bits? As they are a deterministic function of the initial seed, they are not random at all from the perspective of classical probability theory. However, if we understand Kolmogorov complexity, we can generalize the fact 'a string is random if we can't compress it' to say that 'a string looks random to an algorithm $A$ if $A$ can't compress it'. 

A bit more concretely, for a pseudorandom generator, we can test whether it fools certain statistical tests, meaning that the test can't reliably separate whether the input is truly random, or coming from the generator. The string is then _pseudorandom_ for such a fooled test, the test can't find any patterns in it that it could use to compress it.   

You can try this concept in the following widget. It implements four simple $k$-mer statistical tests - those are based on counting frequencies of $k$ consecutive flips for $k \in \{1,2,3,4\}$. Let's see how long you can flip coins, until you flag $k = 4$ - getting 100 flips is not so easy! 

If a test flags your sequence of $n$ flips as nonrandom, it means that some patterns are too rare / too frequent and the statistical tests could in principle compress your $n$ flips to less than $n$ bits. 

<CoinFlipRandomnessWidget />

Here's examples of how pseudorandomness helps to think about all kinds of stuff:

- [Mathematicians believe](https://en.wikipedia.org/wiki/Normal_number) that digits of $\pi$ fool all $k$-mer counting tests. But digits of $\pi$ are not a very good pseudorandom generator: an algorithm that 'tests against $\pi$' is not fooled. 
- Typical pseudorandom generator fools all kinds of basic statistical tests.<Footnote>See e.g. Chapter 3 in [AoCP](https://en.wikipedia.org/wiki/The_Art_of_Computer_Programming). </Footnote> These sequences thus look random to those tests. But they fail to look random to algorithms that can use exponential amount of time (such algorithms can bruteforce all the seeds). 
- in cryptography theory, we like to assume that there are cryptographically secure pseudorandom generators that fool all statistical tests running in polynomial time. We don't know whether such an algorithm exists, but we have practical implementations that fool all known reasonably-fast tests. 
- Classic [overhand shuffle](https://en.wikipedia.org/wiki/Shuffling) sucks and is not used in casinos. But if no player is trying to take advantage of it, the game being played typically looks the same as if the cards were shuffled properly.  
- Is a coin flip really random or not? If you have precise measuring apparatus, you could predict the result by measuring the coin as it is being flipped. But if you don't have the apparatus, you can't predict it. Thus, the result of the coin flip can be called random (unless you have the apparatus). 
- In general, whenever it comes to the discussion of 'what is probability', people often end up talking about quantum physics interpretations and physics in general. But I like a more down-to-earth approach: Randomness is a limit of pseudorandomness - we say that a bit sequence is random whenever we believe that we can safely disregard the existence of an algorithm that could predict/compress it. 
</Expand>

<Expand advanced={true} headline = "Uncomputability">

Unfortunately, there's no simple way to compute the Kolmogorov complexity of most strings, even after we decide on which programming language we use in the definition. To see why, let's see a fun paradox known as [Berry's paradox](https://en.wikipedia.org/wiki/Berry_paradox). Consider the expression:

<Quote>
The smallest positive integer not definable in under sixty letters.
</Quote>

Presumably, there are only so many numbers you can define with sixty letters, so there should be the smallest 'undefinable' one. But wait a minute, that number is 'definable' by the sentence above! <Footnote>I often hear the following, more cheeky variant of Berry's paradox: I claim that all postive integers are interesting. Why? Well, consider the smallest noninteresting number. But this is a very interesting property! </Footnote>

As all the great ideas, Berry's paradox can be formalized into an intersting math theorem, we just have to find the right language to rephrase the paradox properly. Here, the right language is Kolmogorov complexity. 

Here's the rephrasing. If you write positive integers in binary, you can see that talking about them is the same as talking about all binary strings. To formalize the part 'definable in under sixty letters', let's simply consider all those binary strings such that their Kolmogorov complexity is at most some constant $C$. We can call this set of strings $\textrm{Berry}(C)$. 

Now, let's assume that there is an algorithm $A$ that gets a string $x$ as an input an outputs its Kolmogorov complexity $K(x)$. We can use $A$ to perform the devilous plan of Berry: Imagine an algorithm $A'$ that uses $A$ to iterate over all the strings in lexicographical order. It then outputs the first string $x^*$ that has $K(x^*) > C$. I.e., $A'$ outputs the lexicographically smallest string outside of $\textrm{Berry(C)}$. 

But wait a minute! The algorithm $A'$ is just another algorithm that prints a string $x^*$, so $K(x^*) \le |A'|$. If we choose $C$ to be large enough, the two conditions $K(x^*) > C$ and $K(x^*) \le |A'|$ are in contradiction. 

By turning the paradox into a theorem, we can now see where's the problem. We made just one assumption, the existence of an algorithm $A$ computing Kolmogorov complexity. So, this assumption must be wrong, there is unfortunately no such algorithm. <Footnote>This result is closely related to [halting problem](https://en.wikipedia.org/wiki/Halting_problem) and [Gödel's incompleteness theorems](https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems), see e.g. [this book](https://users.math.cas.cz/~pudlak/preface_toc.pdf). </Footnote>
</Expand>

<Expand advanced={true} headline = "Clustering by relative Kolmogorov complexity" >

Here's a fun application of Kolmogorov complexity. First, let's define _relative Kolmogorov complexity_ $K(x | y)$: This is the shortest program to print $x$, if the program can also access a string $y$. For example, there are short codes writing $\pi$, but if we choose $y$ as the Python library `sympy`, the relative complexity of $x = \pi$ becomes even shorter, as we can just run something like `print(sympy.N(sympy.pi, 1000000))`. 

This can be used to measure how much two files $x_1, x_2$ are similar: we measure $K(x_1 \circ x_2)$ versus $K(x_1) + K(x_2)$ ($\circ$ means concatenation). In practice, we use something like ZIP instead, since we can't compute Kolmogorov complexity exactly. 

I was curious to test how it works, the following widget tries to cluster wikipedia pages about three different topics using three algorithms. 

- KL divergence between character frequencies: Remember, this corresponds to looking at one file, and building the best code based on its frequencies and using it for the other file. I compute in both ways and average to make it symmetric. 
- ZIP divergence: ZIP algorithm builds a dictionary of common words and phrases as it scans through the text. But you can persuade it to build one static dictionary on one text and use it for the other texts. Analogously to KL divergence, ZIP divergence is how many more bits you spend if you use this static dictionary built on another file, versus normal ZIP algorithm. 
- normalized compression distance: This is defined as $(K(x \circ y) - \min(K(x), K(y)))/ \max (K(x), K(y))$ - it's about comparing $K(x \circ y)$ with $K(x), K(y)$ as we discussed above. 

Unfortunately, the third one did not work well for me, probably because concatenating files actually does not help in compression by ZIP almost at all. Not sure if I am stupid or if this method sucks. 🤷

<ThreeCategoriesWidget />

One thing I would like to point out on this is that relative entropy (=KL divergence) and relative Kolmogorov complexity are different "relativizations". On the one hand, KL divergence and ZIP divergence are about how _worse_ a code is if it expects different data. On the other hand, relative Kolmogorov is about how much _better_ the compression gets, if we can, but do not have to use some additional data. In short, $H(x, y) \ge H(x)$, but $K(x | y) \le K(x)$.  

</Expand>

################################################################################
ADDITIONAL BONUS CHAPTERS
################################################################################

=================================================================================
=================================================================================
CHAPTER: Multiplicative Weights Update
FILE: 07-algorithms.mdx
=================================================================================
=================================================================================

# Multiplicative weights update <a id="multiplicative-weights"></a>

In the [chapter about machine learning](06-machine_learning), we've seen how KL divergence guides us all the way from having a rough guess about our data to a well-defined optimization problem with a concrete loss function. This is where KL divergence really shines and shows us the way.

But there's one more step missing -- how do we actually solve that final optimization problem? This is where understanding KL isn't necessarily the most important thing. In a few lucky cases (like estimating mean/variance or linear regression), we have explicit formulas for the solution and can just plug numbers into those formulas.

Most machine learning problems, however, are NP hard ($k$-means, neural net optimization) and we try to solve them using some kind of locally-improving algorithm, typically gradient descent. This chapter is about a variant of this algorithm called _multiplicative weights update_.

In this chapter, we'll understand how the algorithm connects to KL divergence and discuss a few applications.

<KeyTakeaway>
Multiplicative weights update is a useful algorithmic trick based on treating probabilities multiplicatively. 
</KeyTakeaway>


## 🔄 Basic algorithm

Let's return to one of our riddles:

Say we want to get rich by investing in the stock market. Fortunately, there are $n$ investors willing to share their advice with us: Each day $t$, they give us some advice, and at the end of the day, we learn how good that advice was—for the $i$-th expert, we'll have gain $g_i^{(t)}$.  

Our general investing strategy is this: We start with a uniform distribution $p_1^{(0)}, \dots, p_n^{(0)}, p_i^{(0)} = 1/n$ over the experts. At the beginning of each day, we sample an expert from this distribution and follow their advice. At the end of the day, we look at the gains $g_i^{(t)}$ and update $p^{(t)}$ to $p^{(t+1)}$.

The question is: how should we update? Let's discuss three possible algorithms from the riddle statement. 

### 🔺 Gradient descent / proportional sampling
One way is using gradient descent:

<Math id="gradient" displayMode={true} math = "p_i^{(t+1)} = p_i^{(t)} + \eps \cdot g_i^{(t)}"/>

where $\eps$ is the [learning rate](https://en.wikipedia.org/wiki/Learning_rate) of the algorithm. After this update, we would of course normalize the probabilities so that they sum to one. 

If we define $G_i^{(t)}$ as the total accumulated gain, i.e., $G_i^{(t)} = g_i^{(1)} + \dots + g_i^{(t)}$, then we can rewrite <EqRef id = "gradient"/> simply as

<Math displayMode={true} math = "p_i^{(t+1)} \propto \eps \cdot G_i^{(t)}" />
Notice that the learning rate doesn't matter due to the normalization, so we end up with the proportional sampling rule from the riddle statement:

<Math displayMode={true} math = "p_i^{(t+1)} \propto G_i^{(t)}" />

This proportional rule has some problems. In the widget, you can notice that if the first expert has gained $67 and the other expert gained $33, the proportional rule goes with the top expert only with 2/3 probability, although it should ideally go for her with close to 100% probability. 

### 👑 Follow the leader 
Maybe sampling the next expert is not the right approach and we should simply pick the best expert so far? This algorithm—called follow the leader—is very natural and works mostly very well. There are some edge cases, though, when it behaves poorly (see the widget). 

### ⚖️ Multiplicative weights update
Multiplicative weights update algorithm is like the gradient descent rule <EqRef id = "gradient"/>, but uses multiplicative instead of additive updates:

<Math displayMode={true} math = "p_i^{(t+1)} \propto p_i^{(t)} \cdot e^{- \eps \cdot g_i^{(t)}}" />

This algorithm interpolates between gradient descent (the limit of this algorithm for $\eps \rightarrow 0$) and follow the leader (the limit for $\eps \rightarrow \infty$). 

If we set $\eps$ in the right way, this turns out to be an amazing algorithm combining the strengths of both approaches. 
The remarkable property is that if you run multiplicative weights algorithm for $t$ steps and set $\eps$ to be about $1/\sqrt{t}$, the algorithm is _always almost as good as the best expert_! In particular, it gains at most $O(\sqrt{t})$ dollars less than the best expert in expectation. <Footnote>Assuming all gains are between $0$ and $1$. If there are $n$ experts, the algorithm lacks at most <Math math = "O(\sqrt{t\log n})" /> dollars in expectation. Check out [this excellent survey](https://www.cs.princeton.edu/~arora/pubs/MWsurvey.pdf) for more math behind the algorithm and its uses in computer science. </Footnote> In other words, whatever sequence of expert gains we could come up with in our widget, MWU would always end up on top. 

## 💡 Intuitions

Let me give you three intuitions for why multiplicative weights update algorithm makes sense.

### 🔄 Bayes updating

You can think of our problem as "trying to find the best expert". In this sense, the algorithm's probability distribution over experts is its "guess about who the best expert is". Whenever we learn how well each expert performed, this corresponds to learning "the likelihood of each expert being the best". Bayes' rule says our guess should be updated multiplicatively by multiplying by the likelihood—which is exactly what the algorithm does.

Notice that a more precise name for the MWU algorithm might be _multiplicative probability update_ since the weights are typically thought of as probabilities. And frankly, that name sounds like a description of Bayes' rule.

### 🎁 Softmax intuition

Let's think about all the information we learn in the first $t$ steps of our investing game. Each expert $i$ accumulated a total gain $G_i^{(t)} = g_i^{(1)} + \dots + g_i^{(t)}$. How should this total gain translate to the probability that we sample them in the $t+1$-th round?

We understand this! In the chapter on [max entropy distributions](04-max_entropy), we've seen how the softmax function is the right generic way of converting numbers to probabilities. So we should have <Math math = "p_i^{(t+1)} \propto e^{\lambda \cdot G_i^{(t)}}" />. The constant $\lambda$ is a proportionality constant we have to decide on by some other means.

But look -- this is exactly what the multiplicative weights algorithm is doing. It updates $p_i$ by multiplying it by <Math math = "e^{\varepsilon \cdot g_i^{(t)}}"/> in each step, so $p_i^{(t)}$ is proportional to <Math math = "e^{\varepsilon \cdot g_i^{(1)}} \cdot \dots \cdot e^{\varepsilon \cdot g_i^{(t)}} = e^{\varepsilon \cdot G_i^{(t)}}"/>. So what we call $\lambda$ in softmax is called the learning rate $\varepsilon$ in multiplicative weights.

### 📐 Geometric intuition

As we've seen in the [preceding chapter](05-machine-learning), it's really nice to think in terms of optimization problems that optimize loss functions. In fact, one step of gradient descent or multiplicative weights can be seen as optimizing a certain loss function. Let's see how.

In our optimization problem, we start with this data: the current distribution $p^{(t)}$ and loss function $-g^{(t)}$ (loss functions are to be minimized, hence the negative sign). Notice how we try to balance two things:

1. We want the new probability distribution $p^{(t+1)}$ to be close to the original one $p^{(t)}$, whatever "close" means.

2. If we sample a random expert from $p^{(t+1)}$, we want them to be as good as possible for the current loss function. That is, we want to minimize $\sum_{i = 1}^n p^{(t+1)}_i \cdot (-g_i)$.

With this in mind, here's an equivalent formulation of gradient descent and multiplicative weights:

<Math displayMode={true} math = "p^{(t+1)}_{\text{gradient descent}} = \argmin_{p} \left(\sum_{i = 1}^n (-g_i) p_i + \eps \cdot \frac12 \sum_{i = 1}^n (p_i - p_i^{(t)})^2\right)."/>

<Math displayMode={true} math = "p^{(t+1)}_{\text{multiplicative weights}} = \argmin_{p, \sum_{i=1}^n p_i = 1} \left(\sum_{i = 1}^n (-g_i) p_i + \eps \cdot \frac12 \sum_{i = 1}^n p_i \cdot \log \frac{p_i}{p_i^{(t)}} \right)."/>

I'll leave it to you to check that the solution of the first optimization problem is $p_{i}^{(t+1)} = p_i^{(t)} + \eps \cdot g_i^{(t)}$<Footnote>Hint: If you differentiate the loss function with respect to $p_i$, you get <Math math = "\frac{\partial \mathcal{L}}{\partial p_i} = (-g_i) + \eps \cdot (p_i - p_i^{(t)})" />.</Footnote>, while the solution to the second optimization problem is <Math math = "p_{i}^{(t+1)} \propto p_i^{(t)} \cdot e^{-\eps \cdot (-g_i^{(t)})}" />.<Footnote>Hint: You can use Lagrange multipliers to replace the hard constraint of $\sum_{i = 1}^n p_i = 1$ with the soft constraint of $\lambda (\sum_{i = 1}^n p_i - 1)$ that goes into the loss function. After differentiating with respect to $p_i$, you get <Math math = "\frac{\partial \mathcal{L}}{\partial p_i} = (-g_i) + \eps \cdot ( \log \frac{p_i}{p_i^{(t)}} + 1) + \lambda" />.</Footnote>

What I want to focus on is how both algorithms try to balance the same two constraints (stay close to original solution, make new one good on current loss), and their difference is pretty much only in how they measure distance in the space of all probability distributions.

Gradient descent corresponds to assuming we should use the standard Euclidean distance (or $\ell_2$ distance) to measure distance between distributions. This is an amazing distance, and if you're optimizing in a complicated multidimensional space, it's a natural choice!

But in the context of our getting-rich riddle, we're optimizing probabilities -- after all, even gradient descent has to be altered to keep projecting its solutions to the probability simplex to make any sense. In this space, the most meaningful way of measuring distances isn't Euclidean distance, but KL divergence. Hence, multiplicative weights.

But wait! KL divergence can't measure distance. We've emphasized how it's important that $D(p,q) \not= D(q,p)$, which seems pretty bad for measuring distance! Fortunately, we're talking about a setup where both distributions $p = p^{(t)}, q = p^{(t+1)}$ are going to end up very close to each other, and in that case, $D(p,q) \approx D(q,p)$ (more about that in the [Fisher information section](07-fisher_info)!).

The general algorithm that generalizes both gradient descent and multiplicative weights is called mirror descent. The algorithm needs to be supplied with a distance-like function. For example, KL divergence works for mirror descent, even though it's asymmetric. It's beyond our scope to analyze what properties a function needs to satisfy to work inside mirror descent. The class of functions that work is called Bregman divergences. This is why _KL divergence_ is called this way -- it's a particular instance of a Bregman divergence.

## 🚀 Applications

Let's briefly discuss some applications of the algorithm.

### 🤖 Machine learning applications

Multiplicative weights are a super important algorithm in machine learning. Essentially, whenever you want to recommend users [the next video](https://www.youtube.com/), provide them [some kind of web search](https://www.google.com/), or aggregate several algorithms together, you're solving a variant of our experts problem. In reinforcement learning, this is called the [multi-armed bandit problem](https://en.wikipedia.org/wiki/Multi-armed_bandit) and it's a bit more complicated than our setup. In our setup, at the end of the day we learn how well each expert performs. But in the bandit setup, we only learn the performance of the chosen expert. For example, if you recommend a certain video, you get feedback whether the user liked it, but you don't get any feedback regarding whether the user likes all the other videos you considered recommending. 

This lack of knowledge about other experts makes this a problem about balancing _exploration_ and _exploitation_. The follow-the-leader strategy that worked pretty well above (except for certain special cases) is based on exploiting the knowledge of who the best expert is. But the strategy can't work by itself because you also have to explore to "find" the best expert. Fortunately, variants of the multiplicative weights algorithm still work pretty well for the bandit problem - they can very nicely balance the tradeoff between exploring (we have a distribution over all experts) and exploiting (good experts are going to dominate it). 

### 💻 Algorithmic applications

Here's my favorite algorithmic application of multiplicative weights that also shows how multiplicative weights connect to the idea of Bayesian updating.

Consider this problem: We're given a sorted array with $n$ numbers and want to find whether it contains $42$. What's the fastest algorithm?

That's easy -- just do [binary search](https://en.wikipedia.org/wiki/Binary_search). It finishes in $O(\log n)$ steps. The binary search algorithm always looks up the number in the middle of the current list and examines its value. Based on that, it can either discard the left half or the right half of the array, and continue with the other half.

Here's a more complicated problem: there are again $n$ numbers $a_1, \dots, a_n$ and we want to find whether they contain some $x$. But this time, whenever we compare $a_j$ with $x$, the comparison fails with $1/3$ probability. That is, if $a_j < x$ and we compare the two, with $1/3$ probability the comparison tells us that $a_j > x$. If $a_j = x$, let's assume for simplicity that we reliably learn this.

This is called the noisy binary search problem and has many applications—sometimes, comparing two objects is more complicated than comparing two numbers and may involve doing some kind of experiment which could fail.

How do we solve this noisy problem? Here's a simple algorithm that finishes in expected $O(\log n)$ steps (assuming $x$ is in the input sequence). Every item in the array starts with weight $1/n$ and we'll keep the weights summing to $1$. In each step, we compare $x$ with the element $i$ that is "in the middle" with respect to the weights: i.e., we choose $i$ such that $a_1 + \dots + a_{i-1} < 1/2$ and $a_{i+1} + \dots + a_n < 1/2$.

If $x < a_i$, we got some evidence that $x$ lies to the left, so we multiply all the weights to the left by two (and normalize the weights afterwards to sum to 1). If $x > a_i$, we behave analogously, and if $x = a_i$ we finish.

Let's see this algorithm in action! <Footnote>Of course, it's a bit silly to run it on an array with 15 elements where it may be faster to just check elements one-by-one. </Footnote>

import NoisyBinarySearchWidget from '@/components/widgets/NoisyBinarySearchWidget';

<NoisyBinarySearchWidget />

You can see how this algorithm implements the general idea behind multiplicative weights: Each element of the array is kind of like an expert. You can also see how this ties nicely with our Bayesian intuition about the multiplicative weights algorithm: You can interpret our starting weights as the uniform prior for which element of the array is $x$ (recall we assume that $x$ is present) and each step of the algorithm is like a Bayesian update that updates these probabilities.

Let's also revisit our original investment problem and see how different algorithms perform in various scenarios:

<MWUWidget />

## 💡 The important idea

The focus of our minicourse was on how KL divergence and related techniques can be used to model the world around us. I think multiplicative weights are a good example of a different application -- KL can guide us to come up with the right algorithm to approach a problem!


=================================================================================
=================================================================================
CHAPTER: Fisher Information
FILE: fisher-info.mdx
=================================================================================
=================================================================================

# Fisher information & statistics

In this chapter, we will explain a bit more about how KL divergence connects to statistics. In particular, one of the key statistical concepts is a so-called Fisher information, and we will see how one can derive it using KL divergence.

<KeyTakeaway>
Fisher information is the limit of KL divergence of close distributions.  
</KeyTakeaway>

## 📊 The polling problem

In [one of our riddles](00-introduction), we have been talking about the problem with polling: If you want to learn the percentage of the vote for one party up to $\eps$, you need sample about $1/\eps^2$ voters. 

<PollingErrorCalculator />

### 📊 The law of large numbers

One way to understand why we need $\Omega(1/\eps^2)$ samples is via [the law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers). This law tells you that if you flip a fair coin $n$ times, you typically get around $n/2 \pm O(\sqrt{n})$ heads. <Footnote>You can prove this by estimating the variance of the sum and using [Chebyshev's inequality](https://en.wikipedia.org/wiki/Chebyshev%27s_inequality). </Footnote>. If your coin is biased and heads come out with probability $1/2 + \eps$, then the law says you will typically see around $(1+\eps)n/2 \pm O(\sqrt{n})$ heads. If you want to be able to separate the two options, you need the two intervals $n/2 \pm O(\sqrt{n})$ and $(1+\eps)n/2 \pm O(\sqrt{n})$ to be disjoint, which means that you have to choose $\eps$ such that $\eps \cdot n \approx \sqrt{n}$, i.e., $n$ should be at least around $1/\eps^2$.

### 💡 KL intuition

But I want to offer a complementary intuition for the polling problem. Let's go all the way back to [the first chapter where we introduced KL](01-definition). Our running example was a Bayesian experimenter who wanted to distinguish whether his coin is fair or not fair. If the two distributions to distinguish are $(50\%, 50\%)$ and $(50\% + \eps, 50\% - \eps)$, then the problem of our experimenter gets extremely similar to the problem of estimating the mean up to $\eps$!

Remember, if we have two very similar distributions, KL between them is going to be positive, but very small. It turns out that

$$
D((0.5 + \eps, 0.5 - \eps), (0.5, 0.5)) \approx 2\eps^2
$$

The intuition we should take from this is that each time we flip a coin, we get around "$2\eps^2$ bits of information" about whether the coin is fair or biased by $\eps$. Intuitively, once we get around 1 bit of information, we begin to be able to say which of the two coins we are looking at. We conclude that the number of trials we need to estimate the bias of a coin should scale like $n = 1/\eps^2$. 

## 🎯 Fisher information

The trick with looking at KL divergence between two very similar distributions can be generalized further. Think of a setup where you have a family of distributions characterized by some number. For example:

- biased coins with heads-probability $p$ for all $p \in [0,1]$.
- gaussians $N(\mu, 1)$ for all $\mu \in \mathbb{R}$.
- gaussians $N(0, \sigma^2)$ for all $\sigma^2 \ge 0$.

More generally, think of a set of distributions $p_\theta$ parameterized by a number $\theta$.

One of the most basic tasks in statistics is that we have an empirical distribution $p$ and we want to find the $\theta$ so that $p_\theta$ fits the data the best, like below. 


![fit](03-minimizing/fit.png)


We have already seen this a few times, and we have seen in [the chapter about minimizing KL](03-minimizing) why the maximum likelihood estimators are a reasonable approach to this.

But we can go a bit further -- if we assume that $p$ has literally been generated by one of the distributions $p_\theta$ for some $\theta$, we may ask how many samples we need to estimate $\theta$ up to additive $\eps$. Our polling question is just a special case of this more general question.

Our intuition about KL tells us if the data were generated by $p_\theta$, to estimate $\theta$ it's key to understand the value of <Math math="D(p_{\theta + \eps}, p_\theta)" />. This is the general (and a bit opaque) formula we thus need to understand:

<Math displayMode={true} math="
D(p_{\theta + \eps}, p_\theta) = \int p_{\theta + \eps}(x) \cdot \log \frac{p_{\theta + \eps}}{p_\theta} dx
" />

We will estimate the value of the right-hand side by computing the derivatives <Math math="\frac{\partial}{\partial \theta} p_{\theta}"/> and <Math math = "\frac{\partial^2}{\partial \theta^2} p_{\theta}" />. In particular, we will estimate <Math math = "p_{\theta + \eps}" /> with the following Taylor-polynomial approximation. 

<Math displayMode={true} math="
p_{\theta + \eps}(x)
\approx
p_{\theta}(x)
+ \eps\cdot \frac{\partial}{\partial \theta} p_{\theta}(x)
+ \frac12 \frac{\partial^2}{\partial \theta^2} p_{\theta}(x)
+ O(\eps^3)
" />

After plugging it in and some calculations <Footnote>[todo fill]</Footnote>, we get

<Math displayMode={true} math="
D(p_{\theta + \eps}, p_\theta) \approx \frac12 I(\theta) \cdot \eps^2 + O(\eps^3)
" />
for 
<Math displayMode={true} math = "I(\theta) = \int p_\theta(x) \cdot (\frac{\partial}{\partial \theta} \log p_\theta(x))^2 dx" />
The term $I(\theta)$ is called _Fisher information_. Let's not try to understand what this integral mean. The short story is that you can approximate KL divergence of two similar distributions as $I(\theta)\cdot \eps^2$ and $I(\theta)$ can often be computed by integration.

Our KL intuition is telling us that estimating a parameter $\theta$ up to $\eps$ should require about <Math math="\Theta\left(\frac{1}{I(\theta)\eps^2}\right)" /> many samples. Let's see what this intuition is saying in some cases:

1. If you want to estimate $p$ of a biased coin, $I(p) = \frac{1}{p(1-p)}$. Thus, our KL intuition suggests that estimating the value of $p$ (with constant probability) should take about $p(1-p)/\eps^2$ samples. This is indeed the right formula (see the widget above). 

2. If you want to find the mean of normal random variable with known variance $\sigma^2$, we have $I(\mu) = 1/\sigma^2$. Hence, our KL intuition suggests that estimating $\mu$ up to $\eps$ requires about $\sigma^2 / \eps^2$ samples.

3. If you want to find the variance of normal random variable with known mean $\mu$, we have $I(\sigma^2) = 1/(2\sigma^4)$. Hence, our KL intuition suggests that estimating $\sigma^2$ requires about $\sigma^4 / \eps^2$ samples.

In all above cases, it turns out to be the case that our intuition is correct and really describes how many samples you need to solve given problem. In fact, there are two important results in statistics: One of them is [Cramér-Rao lower bound](https://en.wikipedia.org/wiki/Cram%C3%A9r%E2%80%93Rao_bound) that basically says that our formula of $n = 1/(I(\theta)\eps^2)$ is indeed a lower bound. On the other hand, the so-called [asymptotic normality theorem for MLE](https://gregorygundersen.com/blog/2019/11/28/asymptotic-normality-mle/) says that the MLE estimator is as good as our formula. <Footnote> These theorems use somewhat different language and measure the goodness of an estimator using its variance. </Footnote>

The upshot is that computing KL between two close distributions basically answers the most fundamental question of (frequentist) statistics -- how many samples do I need to get a good estimate of a parameter. 

## 📏 Fisher metric

Although KL divergence is asymetrical, it gets symmetrical in the limit. That is, if we do the computation for <Math math="D(p_\theta, p_{\theta + \eps})" /> instead of <Math math="D(p_{\theta + \eps}, p_\theta)" />, we would get the same expression up to some $O(\eps^3)$ terms. So, in this setup where we try to understand two distributions that are very close together, we can really think of it as being symetric. This way, we can define a proper distance function on the space of distributions -- it's called [Fisher information metric](https://en.wikipedia.org/wiki/Fisher_information_metric) and can give useful intuitions. For example, for the case of biased-coin-flipping distributions where coins have bias $p \in [0,1]$, we can represent all of them using a segment like this:

![Fisher metric](07-fisher_info/fisher2.png)

The Fisher information metric says that locally, the KL distance around a point $p$ is proportional to $I(p) = 1/(p(1-p))$. That is, the probabilities around $1/2$ are "closer together" than the probabilities at the edges. 
This is a supercharged-abstract-fancy way of saying what we have already seen many times -- probabilities should often be handled multiplicatively, not additively.



################################################################################
META PAGES
################################################################################

=================================================================================
=================================================================================
CHAPTER: Resources
FILE: resources.mdx
=================================================================================
=================================================================================

# Resources <a id="resources"></a>

Here are some great resources for further exploring related topics. 

## 📝 Blog posts <a id="introductory-resources"></a>
- A [series](https://www.lesswrong.com/w/bayes-rule) of great explanations and applications of Bayes' rule by alexei and E. Yudkowsky
- A [series](https://blog.alexalemi.com/kl.html) of [amazing](https://blog.alexalemi.com/kl-is-all-you-need.html) blog [posts](https://blog.alexalemi.com/diffusion.html) at _Alex Alemi's blog_ about intuition for KL divergence and its applications. 
- [Amazing post with different intuitions behind KL divergence](https://www.lesswrong.com/posts/no5jDTut5Byjqb4j5/six-and-a-half-intuitions-for-kl-divergence): a LessWrong post by CallumMcDougall. 

Other blog posts
- [Intuition behind KL Divergence](https://johfischer.com/2021/12/31/intuitive-explanation-of-the-kullback-leibler-divergence/) by Johannes Schusterbauer. 
- [Intuition behind KL divergence](https://www.countbayesie.com/blog/2017/5/9/kullback-leibler-divergence-explained) by Will Kurt. 
- [Maximum Entropy and Bayes' rule](https://risingentropy.com/maximum-entropy-and-bayes/) by Rising Entropy blog
- [Minimum relative entropy and maximum entropy principle](https://caseychu.io/posts/maximum-entropy-kl-divergence-and-bayesian-inference/#:~:text=,one%20with%20the%20maximum%20entropy)
- [Lecture notes on MLE, minimum relative entropy, maximum entropy](https://sites.stat.washington.edu/mmp/courses/stat538/winter12/Handouts/l8-maxent.pdf#:~:text=q0,x)

## 📚 Books <a id="intermediate-resources"></a>
RTFM
- [Probability Theory: The Logic of Science](https://bayes.wustl.edu/etj/prob/book.pdf) by E. Jaynes <Footnote>Jaynes is the father of maximum entropy principle and other profound ideas. His book is at times philosophical, and usually very enlightening. Also, it is unfinished and contains errors.</Footnote>

Other books
- [Elements of Information Theory](https://www.wiley.com/en-us/Elements+of+Information+Theory%2C+2nd+Edition-p-9780471241959) by Thomas Cover & Joy Thomas
- [Entropic Physics](https://drive.google.com/file/d/1faiZCbg_HnmKayI7hBFWfhNSuZZU451Y/view) by Ariel Caticha 
- [Machine Learning: A Probabilistic Perspective](https://probml.github.io/pml-book/book0.html) by Kevin P. Murphy
- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/itprnn/book.html) by David MacKay




=================================================================================
=================================================================================
CHAPTER: About
FILE: about.mdx
=================================================================================
=================================================================================

# 📚 About This Mini-Course <a id="what-this-course-covers"></a>

This mini-course starts with [a few puzzles and challenges](00-introduction), all of them at the intersection of probability, information theory, and machine learning. They motivate the next five chapters that build up the relevant theory to solve them. 

Here are some keywords we will explore: KL divergence, entropy, cross-entropy, max likelihood & max entropy principles, loss functions, coding theory, compression, and more. 

## 📖 How to read this

Skip stuff you find boring, especially expanding boxes & footnotes. Skip boxes labeled with ⚠️, unless you are really into the topic. Follow links, get nerdsniped, and don't feel the need to read this linearly. 

This mini-course does not contain many formal theorem statements or proofs since the aim is to convey intuition in an accessible way. The downside is that some discussions are necessarily a bit imprecise. If you are missing precision / proofs, copy-paste the relevant chapter to your favorite LLM and ask it. 

The total length of the main text is about 2 chapters of Harry Potter and the Philosopher's Stone (from the beginning to Harry's first experience with magic). About 5 chapters if you read all footnotes, expand boxes, and bonus content (Harry learns he's a wizard). In either case, I can't promise you will feel the same as Harry.  

{/*
If you want to gain experience and level up your probability stats, you can't take Harry-Potter-reading approach, though. 
See [resources](resources) for some links. 
*/}

## 🧠 What is assumed <a id="what-we-assume"></a>

I assume probability knowledge after taking a typical introductory course at university.  
You should be familiar with the basic language of probability theory: probabilities, distributions, random variables, independence, expectations, variance, and standard deviation. 

[Bayes' rule](https://www.lesswrong.com/w/bayes-rule) is going to be especially important.<Footnote>There are always more levels of understanding. I am a professional mathematician / computer scientist and still didn't appreciate Bayes' rule enough until reading [Yudkowsky's](https://www.lesswrong.com/w/bayes-rule) [explanations](https://www.lesswrong.com/w/test-2). </Footnote>
I also assume that you get the gist of [the law of large numbers](https://en.wikipedia.org/wiki/Law_of_large_numbers) <Footnote>If you keep flipping a coin with bias $p$ and $X_i$ is the $i$-th outcome, the so-called sample mean $\hat{p} = 1/n \cdot \sum_{i = 1}^n X_i$ is likely to be very close to the true bias $p$. </Footnote> and maybe even the [central limit theorem](https://en.wikipedia.org/wiki/Central_limit_theorem). <Footnote>If you keep flipping a coin and $X_i$ is the $i$-th outcome, the distribution of the sample mean is going to look like the normal distribution, with standard deviation about $1/\sqrt{n}$ for $n$ flips. </Footnote> While Little Prince is cool, it helps if you associate the [slender, bell-shape curve of normal distribution](https://en.wikipedia.org/wiki/Bell-shaped_function#/media/File:Normal_Distribution_PDF.svg) with $e^{-x^2}$ rather than a [devoured elephant](https://www.amazon.com/KIUB-Postcard-Little-elephant-10x15cm/dp/B0CKSVVWDL). 

Knowing example uses of statistics and machine learning helps a good bit to appreciate the context.


## 🎯 About This Project

We (Tom and Vašek) are both academics, but also fans of LessWrong-style rationality. We had a joint probability seminar at Charles University, talking about stuff we find especially interesting/important/underrated/beautiful. 

But also, there's a big, wide open exposition problem<Footnote>The phrase comes from one of my [favorite exposition papers](https://timothychow.net/forcing.pdf). </Footnote> - We happen to enjoy the short time window when LLMs are already pretty smart, but we are not yet completely dominated by them. How can we use them to teach better? We try to take a stab at it by working with Claude/GPT on adding as many interactive widgets to this site as possible. Let us know if this works for you better than reading a book!


{/*Our hope is that by the end of this mini-course, you will not only remember the formula for  KL divergence, but also get a better language and intuitions for all kinds of problems that involve reasoning under uncertainty and modelling the world around us. */}

## 👥 Authors

<div style={{display: 'flex', gap: '3rem', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '2rem'}}>
  <div style={{textAlign: 'center', maxWidth: '250px'}}>
    <img src="fig/claude.png" alt="claude" style={{width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}} />
    <p><a href="https://claude.ai/">Claude</a> is a model from Anthropic.</p>
  </div>

  <div style={{textAlign: 'center', maxWidth: '250px'}}>
    <img src="fig/gavento.jpg" alt="Tom Gavenčiak" style={{width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}} />
    <p><a href="https://gavento.cz/">Tom Gavenčiak</a> is a researcher in AI alignment and applied rationality at Charles University in Prague.</p>
  </div>

  <div style={{textAlign: 'center', maxWidth: '250px'}}>
    <img src="fig/vasek.jpg" alt="Vašek Rozhoň" style={{width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}} />
    <p><a href="https://vaclavrozhon.github.io/">Vašek Rozhoň</a> is a computer science researcher and an assistant professor at Charles University in Prague. With friends, he runs the [polylog channel](https://www.youtube.com/@PolylogCS). </p>
  </div>
</div>

## 💬 Feedback

We would be grateful if you leave feedback [here](https://forms.gle/YourFormID) [todo], write a comment, or reach out to us directly. 


_Thanks to Gemini, GPT, Robert Šámal, Pepa Tkadlec for feedback. _




=================================================================================
=================================================================================
CHAPTER: Bonus
FILE: bonus.mdx
=================================================================================
=================================================================================

# Bonus

I wrote some additional materials that did not fit with the main story in the end. Here they are. 

## ⚖️ [Multiplicative Weights Update](/07-algorithms)




We explore the Multiplicative Weights Update (MWU) algorithm and its connections to entropy. This is a powerful algorithmic framework that appears in many areas of machine learning, game theory, and optimization.

Here's a motivating riddle: 

<Expand advanced={false} headline="💰 How to get rich"> <a id="get-rich"></a>

Here's a riddle that's behind a ton of recent algorithms in CS and ML. Say you wanna get rich trading stocks. Lucky you—$n$ investors share their tips every day. Each day $t$, they give advice, and afterward you find out how they did. For investor $i$, you get $g_i^{(t)}$ - how many dollars she gained that day.

Your strategy: Start with equal trust in everyone—$p_i^{(0)} = 1/n$ for all investors. Each morning, randomly pick an investor based on your trust distribution and follow their advice. After seeing how everyone did, update your distribution to $p^{(t+1)}$.

How should you update? What's best? <Footnote>The symbol $\propto$ means that the probability is only _proportional_ to this, you have to normalize the numbers so that they sum to one. </Footnote>

<MultipleChoiceQuestion
  options={[
    <>Follow the leader: Go with the expert that has the largest gain so far</>,
    <>Proportional sampling: <Math math="p_i^{(t+1)} \propto \ell_i^{(1)} + \dots + \ell_i^{(t)}" /></>,
    <>Multiplicative sampling: <Math math="p_i^{(t+1)} \propto e^{\eps \cdot \left( \ell_i^{(1)} + \dots + \ell_i^{(t)} \right) }" /> for some small <Math math="\eps" /></>
    ]}
  correctIndices={[0, 2]}
  explanation={<>The last option is the most robust, though follow-the-leader typically also works well. It's called multiplicative weights update, and it looks weirdly like gradient descent. [We'll see](07-algorithms) how KL divergence explains the connection.<br/><br/>Try it yourself with the widget below:<br/><br/><MWUWidget /></>}
/>
</Expand>


## 🎣 [Fisher Information](/fisher-info)

We dive into Fisher information and its fundamental role in statistics and information geometry. We derive it as a limit of KL divergence for close distributions. 

Here's a motivating riddle: 

<Expand advanced={false} headline="🗳️ Why polling sucks"><a id="polling"></a>

A typical [US election poll](https://en.wikipedia.org/wiki/Nationwide_opinion_polling_for_the_2024_United_States_presidential_election) asks 1000-2000 random people. Do the math and you'll find such polls are usually within 2-3% of the truth.<Footnote>This assumes you can actually sample random voters, they tell the truth, etc. This is never true but stick with me.</Footnote> Pretty wild—it doesn't even matter how many people live in the country, 1000 random ones get you within a few percent!

But here's the thing: US elections are super close. We already know both parties will get around 50%. So maybe we should poll more people (or combine polls) to get within 0.1%. How many people would that take?

<MultipleChoiceQuestion
  options={["about 10,000", "about 100,000", "about 1,000,000"]}
  correctIndices={[2]}
  explanation={<>It's about 1,000,000! That's a huge chunk of the whole US! The general rule: to get error margin <Math math="\eps" />, you need roughly <Math math="1/\eps^2" /> samples. That square is killer—it's why getting better estimates gets expensive fast! No wonder most polls stick to a few thousand people.<br/><br/>But why <Math math="1/\eps^2" />? Explore the relationship below:<br/><br/><PollingErrorCalculator /></>}
/>
</Expand>


