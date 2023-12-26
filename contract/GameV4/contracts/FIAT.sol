// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './libs/SafeMath.sol';
import './libs/SafeTransferLib.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Router02.sol';

// import 'hardhat/console.sol';

contract FIAT is ERC20, Ownable, ERC20Burnable {
  using SafeMath for uint256;
  using SafeTransferLib for address payable;

  IUniswapV2Router02 public uniswapV2Router;
  address public uniswapV2Pair;

  address public teamWallet;
  address public revShareWallet;

  // swap everytime this contract hold more than 1k fiat
  uint256 public swapTokensAtAmount = 1000 * 1e18;

  uint256 public totalFees = 50; // 50/1000
  uint256 public revShareFee = 20;
  uint256 public liquidityFee = 10;
  uint256 public teamFee = 20;
  uint256 public burnFee = 0;

  uint256 public tokensForRevShare = 0;
  uint256 public tokensForLiquidity = 0;
  uint256 public tokensForTeam = 0;

  /******************/

  mapping(address => bool) private _isExcludedFromFees;

  event ExcludeFromFees(address indexed account, bool isExcluded);

  event revShareWalletUpdated(address indexed newWallet, address indexed oldWallet);

  event teamWalletUpdated(address indexed newWallet, address indexed oldWallet);

  event SwapAndLiquify(uint256 tokensSwapped, uint256 ethReceived, uint256 tokensIntoLiquidity);

  constructor(
    address initialOwner,
    address _teamWallet,
    address _revShareWallet
  ) ERC20('FIAT0', '$FIAT0') Ownable(initialOwner) {
    // uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).createPair(address(this), uniswapV2Router.WETH());

    teamWallet = _teamWallet;
    revShareWallet = _revShareWallet;

    excludeFromFees(address(0), true);
    excludeFromFees(address(this), true);
    excludeFromFees(owner(), true);
    excludeFromFees(teamWallet, true);
    excludeFromFees(revShareWallet, true);
  }

  receive() external payable {}

  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function updateUniswapAddresses(address _uniswapV2Pair, address _uniswapV2Router) public onlyOwner {
    uniswapV2Pair = _uniswapV2Pair;
    uniswapV2Router = IUniswapV2Router02(_uniswapV2Router);
  }

  function updateSwapTokensAtAmount(uint256 newAmount) external onlyOwner returns (bool) {
    swapTokensAtAmount = newAmount;
    return true;
  }

  function updateFees(
    uint256 _revShareFee,
    uint256 _liquidityFee,
    uint256 _teamFee,
    uint256 _burnFee
  ) external onlyOwner {
    require(_revShareFee + _liquidityFee + _teamFee + _burnFee <= 1000, 'Fees must be <= 1000.');
    revShareFee = _revShareFee;
    liquidityFee = _liquidityFee;
    teamFee = _teamFee;
    burnFee = _burnFee;
    totalFees = revShareFee + liquidityFee + teamFee + burnFee;
  }

  function excludeFromFees(address account, bool excluded) public onlyOwner {
    _isExcludedFromFees[account] = excluded;
    emit ExcludeFromFees(account, excluded);
  }

  function isExcludedFromFees(address account) public view returns (bool) {
    return _isExcludedFromFees[account];
  }

  function updateRevShareWallet(address newRevShareWallet) external onlyOwner {
    emit revShareWalletUpdated(newRevShareWallet, revShareWallet);
    revShareWallet = newRevShareWallet;
  }

  function updateTeamWallet(address newWallet) external onlyOwner {
    emit teamWalletUpdated(newWallet, teamWallet);
    teamWallet = newWallet;
  }

  function _update(address from, address to, uint256 amount) internal override {
    if (amount == 0) return;

    bool isBuy = from == uniswapV2Pair;
    bool isSell = to == uniswapV2Pair;
    bool isSwap = isBuy || isSell;

    uint256 contractTokenBalance = balanceOf(address(this));

    bool canSwap = contractTokenBalance >= swapTokensAtAmount;

    if (canSwap && isSwap && !_isExcludedFromFees[from] && !_isExcludedFromFees[to]) {
      swapBack();
    }

    // only take fees on buys/sells, do not take on wallet transfers
    bool takeFee = !_isExcludedFromFees[from] && !_isExcludedFromFees[to] && (isSell || isBuy);
    uint256 fees = 0;

    if (takeFee) {
      fees = amount.mul(totalFees).div(1000);
      tokensForLiquidity += (fees * liquidityFee) / totalFees;
      tokensForTeam += (fees * teamFee) / totalFees;
      tokensForRevShare += (fees * revShareFee) / totalFees;
      uint256 tokensForBurn = (fees * burnFee) / totalFees;

      if (fees > 0) {
        super._update(from, address(0), tokensForBurn);
        super._update(from, address(this), fees - tokensForBurn);
      }

      amount -= fees;
    }

    super._update(from, to, amount);
  }

  function swapTokensForEth(uint256 tokenAmount) private {
    // generate the uniswap pair path of token -> weth
    address[] memory path = new address[](2);
    path[0] = address(this);
    path[1] = uniswapV2Router.WETH();

    _approve(address(this), address(uniswapV2Router), tokenAmount);

    // make the swap
    uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      tokenAmount,
      0, // accept any amount of ETH
      path,
      address(this),
      block.timestamp
    );
  }

  function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
    // approve token transfer to cover all possible scenarios
    _approve(address(this), address(uniswapV2Router), tokenAmount);

    // add the liquidity
    uniswapV2Router.addLiquidityETH{value: ethAmount}(
      address(this),
      tokenAmount,
      0, // slippage is unavoidable
      0, // slippage is unavoidable
      owner(),
      block.timestamp
    );
  }

  function swapBack() private {
    uint256 contractBalance = balanceOf(address(this));
    uint256 totalTokensToSwap = tokensForLiquidity + tokensForRevShare + tokensForTeam;

    if (contractBalance == 0 || totalTokensToSwap == 0) {
      return;
    }

    uint256 liquidityTokens = (contractBalance * tokensForLiquidity) / totalTokensToSwap;
    uint256 amountToSwapForETH = contractBalance.sub(liquidityTokens);

    uint256 initialETHBalance = address(this).balance;

    swapTokensForEth(amountToSwapForETH);

    uint256 ethBalance = address(this).balance.sub(initialETHBalance);

    uint256 ethForTeam = ethBalance.mul(tokensForTeam).div(totalTokensToSwap);

    uint256 ethForLiquidity = ethBalance.mul(tokensForLiquidity).div(totalTokensToSwap);

    // uint256 ethForRevShare = ethBalance - ethForTeam - ethForLiquidity;

    payable(teamWallet).safeTransferETH(ethForTeam);

    if (liquidityTokens > 0 && ethForLiquidity > 0) {
      addLiquidity(liquidityTokens, ethForLiquidity);
      // console.log(liquidityTokens, ethForLiquidity);
      emit SwapAndLiquify(amountToSwapForETH, ethForLiquidity, tokensForLiquidity);
    }

    payable(revShareWallet).safeTransferETH(address(this).balance);

    tokensForLiquidity = 0;
    tokensForRevShare = 0;
    tokensForTeam = 0;
  }

  function withdrawStuckToken() external onlyOwner {
    uint256 balance = IERC20(address(this)).balanceOf(address(this));
    IERC20(address(this)).transfer(msg.sender, balance);
    payable(msg.sender).transfer(address(this).balance);
  }

  function withdrawStuckEth(address toAddr) external onlyOwner {
    payable(toAddr).safeTransferETH(address(this).balance);
  }
}
